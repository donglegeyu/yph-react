package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.dto.UserPermissionVO;
import com.material.server.entity.*;
import com.material.server.mapper.*;
import com.material.server.service.SysPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysPermissionServiceImpl implements SysPermissionService {

    private final SysUserMapper sysUserMapper;
    private final SysDeptMapper sysDeptMapper;
    private final SysRoleMapper sysRoleMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final SysRoleMenuMapper sysRoleMenuMapper;
    private final SysRoleDeptMapper sysRoleDeptMapper;
    private final NavMenuMapper navMenuMapper;

    private static final Map<Integer, String> DATA_SCOPE_DESC = Map.of(
            1, "全部数据",
            2, "自定义部门",
            3, "本部门数据",
            4, "本部门及以下数据",
            5, "仅本人数据");

    @Override
    public UserPermissionVO getUserPermissions(Long userId) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            return null;
        }

        UserPermissionVO vo = new UserPermissionVO();
        vo.setUserId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setDeptId(user.getDeptId());

        // 部门名称 + 公司（根节点）
        if (user.getDeptId() != null) {
            SysDept dept = sysDeptMapper.selectById(user.getDeptId());
            if (dept != null) {
                vo.setDeptName(dept.getDeptName());
                String ancestors = dept.getAncestors();
                if (ancestors != null && !ancestors.isEmpty()) {
                    for (String p : ancestors.split(",")) {
                        try {
                            long aid = Long.parseLong(p.trim());
                            if (aid != 0L) {
                                SysDept company = sysDeptMapper.selectById(aid);
                                if (company != null) {
                                    vo.setCompanyId(company.getId());
                                    vo.setCompanyName(company.getDeptName());
                                }
                                break;
                            }
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }
                if (vo.getCompanyId() == null && (dept.getParentId() == null || dept.getParentId() == 0L)) {
                    vo.setCompanyId(dept.getId());
                    vo.setCompanyName(dept.getDeptName());
                }
            }
        }

        // 1. 查用户的所有角色
        LambdaQueryWrapper<SysUserRole> urQuery = new LambdaQueryWrapper<>();
        urQuery.eq(SysUserRole::getUserId, userId);
        List<Long> roleIds = sysUserRoleMapper.selectList(urQuery).stream()
                .map(SysUserRole::getRoleId)
                .collect(Collectors.toList());

        List<SysRole> roles = roleIds.isEmpty() ? Collections.emptyList() : sysRoleMapper.selectBatchIds(roleIds);
        vo.setRoles(roles.stream()
                .map(r -> new UserPermissionVO.RoleBrief(r.getId(), r.getRoleName(), r.getRoleCode()))
                .collect(Collectors.toList()));

        // 2. 计算数据范围（取角色中范围最大的：1全部 > 4本部门及以下 > 3本部门 > 2自定义 > 5仅本人）
        UserPermissionVO.DataScopeInfo scopeInfo = new UserPermissionVO.DataScopeInfo();
        if (roles.isEmpty()) {
            scopeInfo.setType(5);
            scopeInfo.setDescription(DATA_SCOPE_DESC.get(5));
            scopeInfo.setDeptIds(Collections.emptyList());
            scopeInfo.setDeptNames(Collections.emptyList());
        } else {
            // 优先级：1 > 4 > 3 > 2 > 5
            int finalScope = roles.stream()
                    .map(SysRole::getDataScope)
                    .min(Comparator.comparingInt(this::scopePriority))
                    .orElse(5);
            scopeInfo.setType(finalScope);
            scopeInfo.setDescription(DATA_SCOPE_DESC.getOrDefault(finalScope, "未知"));

            // 自定义部门时，聚合所有角色的 deptIds
            if (finalScope == 2) {
                LambdaQueryWrapper<SysRoleDept> rdQuery = new LambdaQueryWrapper<>();
                rdQuery.in(SysRoleDept::getRoleId, roleIds);
                List<Long> deptIds = sysRoleDeptMapper.selectList(rdQuery).stream()
                        .map(SysRoleDept::getDeptId)
                        .distinct()
                        .collect(Collectors.toList());
                scopeInfo.setDeptIds(deptIds);
                if (!deptIds.isEmpty()) {
                    List<SysDept> depts = sysDeptMapper.selectBatchIds(deptIds);
                    scopeInfo.setDeptNames(depts.stream().map(SysDept::getDeptName).collect(Collectors.toList()));
                } else {
                    scopeInfo.setDeptNames(Collections.emptyList());
                }
            } else {
                scopeInfo.setDeptIds(Collections.emptyList());
                scopeInfo.setDeptNames(Collections.emptyList());
            }
        }
        vo.setDataScope(scopeInfo);

        // 3. 查角色关联的所有菜单（功能权限）
        if (roleIds.isEmpty()) {
            vo.setMenus(Collections.emptyList());
            vo.setPermissions(Collections.emptyList());
            return vo;
        }

        LambdaQueryWrapper<SysRoleMenu> rmQuery = new LambdaQueryWrapper<>();
        rmQuery.in(SysRoleMenu::getRoleId, roleIds);
        List<Long> menuIds = sysRoleMenuMapper.selectList(rmQuery).stream()
                .map(SysRoleMenu::getMenuId)
                .distinct()
                .collect(Collectors.toList());

        if (menuIds.isEmpty()) {
            vo.setMenus(Collections.emptyList());
            vo.setPermissions(Collections.emptyList());
            return vo;
        }

        List<NavMenu> menus = navMenuMapper.selectBatchIds(menuIds);

        // 提取按钮权限标识（perms）
        List<String> permissions = menus.stream()
                .map(NavMenu::getPerms)
                .filter(Objects::nonNull)
                .filter(p -> !p.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        vo.setPermissions(permissions);

        // 构建菜单树（只含 M 目录 和 C 菜单，不含 F 按钮）
        List<UserPermissionVO.MenuNode> menuTree = buildMenuTree(menus);
        vo.setMenus(menuTree);

        return vo;
    }

    private int scopePriority(int scope) {
        // 数字越小优先级越高
        switch (scope) {
            case 1: return 0;
            case 4: return 1;
            case 3: return 2;
            case 2: return 3;
            case 5: return 4;
            default: return 5;
        }
    }

    private List<UserPermissionVO.MenuNode> buildMenuTree(List<NavMenu> menus) {
        // 只保留目录(M)和菜单(C)
        List<NavMenu> filtered = menus.stream()
                .filter(m -> !"F".equals(m.getMenuCategory()))
                .collect(Collectors.toList());

        Map<Long, List<UserPermissionVO.MenuNode>> byParent = new HashMap<>();
        List<UserPermissionVO.MenuNode> allNodes = new ArrayList<>();
        for (NavMenu m : filtered) {
            UserPermissionVO.MenuNode node = new UserPermissionVO.MenuNode();
            node.setId(m.getId());
            node.setKey(m.getKey());
            node.setLabel(m.getLabel());
            node.setPath(m.getPath());
            node.setMenuCategory(m.getMenuCategory());
            node.setParentId(m.getParentId());
            node.setChildren(new ArrayList<>());
            allNodes.add(node);
            Long pid = m.getParentId() == null ? 0L : m.getParentId();
            byParent.computeIfAbsent(pid, k -> new ArrayList<>()).add(node);
        }

        // 挂载 children
        for (UserPermissionVO.MenuNode node : allNodes) {
            List<UserPermissionVO.MenuNode> children = byParent.get(node.getId());
            if (children != null) {
                node.setChildren(children);
            }
        }

        // 返回根节点（parentId 为 0 或不在当前列表里的）
        Set<Long> nodeIds = allNodes.stream().map(UserPermissionVO.MenuNode::getId).collect(Collectors.toSet());
        return allNodes.stream()
                .filter(n -> n.getParentId() == null || n.getParentId() == 0L || !nodeIds.contains(n.getParentId()))
                .collect(Collectors.toList());
    }
}
