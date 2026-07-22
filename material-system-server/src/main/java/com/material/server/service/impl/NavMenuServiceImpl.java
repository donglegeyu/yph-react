package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.NavMenu;
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysDomainMenu;
import com.material.server.entity.SysRole;
import com.material.server.entity.SysRoleMenu;
import com.material.server.entity.SysUserRole;
import com.material.server.mapper.NavMenuMapper;
import com.material.server.mapper.SysDomainMapper;
import com.material.server.mapper.SysDomainMenuMapper;
import com.material.server.mapper.SysRoleMapper;
import com.material.server.mapper.SysRoleMenuMapper;
import com.material.server.mapper.SysUserRoleMapper;
import com.material.server.service.NavMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NavMenuServiceImpl extends ServiceImpl<NavMenuMapper, NavMenu> implements NavMenuService {

    private final SysDomainMenuMapper sysDomainMenuMapper;
    private final SysDomainMapper sysDomainMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final SysRoleMapper sysRoleMapper;
    private final SysRoleMenuMapper sysRoleMenuMapper;

    @Override
    public List<NavMenu> getTreeList() {
        List<NavMenu> all = list(new LambdaQueryWrapper<NavMenu>()
                .eq(NavMenu::getDeleted, 0)
                .orderByAsc(NavMenu::getSort)
                .orderByAsc(NavMenu::getId));

        Map<Long, List<NavMenu>> childrenMap = all.stream()
                .filter(m -> m.getParentId() != null && m.getParentId() > 0)
                .collect(Collectors.groupingBy(NavMenu::getParentId));

        // 先找根节点 (parentId = 0)
        List<NavMenu> roots = all.stream()
                .filter(m -> m.getParentId() == null || m.getParentId() == 0)
                .collect(Collectors.toList());

        // 递归构建树
        return buildTreeRecursive(roots, childrenMap);
    }

    @Override
    public List<NavMenu> getTreeListByDomainId(Long domainId) {
        LambdaQueryWrapper<SysDomainMenu> domainMenuQuery = new LambdaQueryWrapper<>();
        domainMenuQuery.eq(SysDomainMenu::getDomainId, domainId);
        domainMenuQuery.orderByAsc(SysDomainMenu::getSort);
        List<SysDomainMenu> domainMenus = sysDomainMenuMapper.selectList(domainMenuQuery);

        if (domainMenus.isEmpty()) {
            return new ArrayList<>();
        }

        Set<Long> menuIds = domainMenus.stream()
                .map(SysDomainMenu::getMenuId)
                .collect(Collectors.toSet());

        List<NavMenu> allMenus = list(new LambdaQueryWrapper<NavMenu>()
                .in(NavMenu::getId, menuIds)
                .eq(NavMenu::getDeleted, 0)
                .orderByAsc(NavMenu::getSort)
                .orderByAsc(NavMenu::getId));

        Map<Long, NavMenu> menuMap = allMenus.stream()
                .collect(Collectors.toMap(NavMenu::getId, m -> m));

        Map<Long, SysDomainMenu> domainMenuByMenuId = domainMenus.stream()
                .collect(Collectors.toMap(SysDomainMenu::getMenuId, dm -> dm, (a, b) -> a));

        Map<Long, SysDomainMenu> domainMenuById = domainMenus.stream()
                .collect(Collectors.toMap(SysDomainMenu::getId, dm -> dm));

        Map<Long, List<Long>> childrenMap = new LinkedHashMap<>();
        List<Long> rootMenuIds = new ArrayList<>();
        Set<Long> missingParentMenuIds = new java.util.LinkedHashSet<>();

        // 第一轮：收集缺失的父级菜单
        for (SysDomainMenu dm : domainMenus) {
            if (dm.getCustomParentId() != null) {
                continue;
            }
            NavMenu navMenu = menuMap.get(dm.getMenuId());
            if (navMenu == null || navMenu.getParentId() == null || navMenu.getParentId() == 0) {
                continue;
            }
            Long sysParentId = navMenu.getParentId();
            if (!domainMenuByMenuId.containsKey(sysParentId)) {
                missingParentMenuIds.add(sysParentId);
            }
        }

        // 补全缺失的父级菜单到 menuMap
        if (!missingParentMenuIds.isEmpty()) {
            List<NavMenu> missingParents = list(new LambdaQueryWrapper<NavMenu>()
                    .in(NavMenu::getId, missingParentMenuIds)
                    .eq(NavMenu::getDeleted, 0)
                    .orderByAsc(NavMenu::getSort)
                    .orderByAsc(NavMenu::getId));
            for (NavMenu parent : missingParents) {
                menuMap.put(parent.getId(), parent);
            }
        }

        // 第二轮：构建树结构（此时 menuMap 已包含补全的父级）
        for (SysDomainMenu dm : domainMenus) {
            Long effectiveParentMenuId = getEffectiveParentMenuId(dm, domainMenuByMenuId, domainMenuById, menuMap);
            if (effectiveParentMenuId == null) {
                rootMenuIds.add(dm.getMenuId());
            } else {
                childrenMap.computeIfAbsent(effectiveParentMenuId, k -> new ArrayList<>()).add(dm.getMenuId());
            }
        }

        // 补全的父级菜单也需要挂到树中
        for (Long missingParentId : missingParentMenuIds) {
            NavMenu missingParent = menuMap.get(missingParentId);
            if (missingParent == null) continue;
            Long grandParentId = missingParent.getParentId();
            if (grandParentId != null && grandParentId != 0 && menuMap.containsKey(grandParentId)) {
                childrenMap.computeIfAbsent(grandParentId, k -> new ArrayList<>()).add(missingParentId);
            } else {
                rootMenuIds.add(missingParentId);
            }
        }

        List<NavMenu> roots = rootMenuIds.stream()
                .map(menuMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return buildDomainTree(roots, childrenMap, menuMap, domainMenuByMenuId, true);
    }

    @Override
    public List<NavMenu> getTreeListByDomainIdAndUserId(Long domainId, Long userId) {
        List<NavMenu> domainTree = domainId != null
                ? getTreeListByDomainId(domainId)
                : getTreeList();

        if (userId == null) {
            return domainTree;
        }

        List<SysUserRole> userRoles = sysUserRoleMapper.selectList(
                new LambdaQueryWrapper<SysUserRole>().eq(SysUserRole::getUserId, userId));
        if (userRoles.isEmpty()) {
            return filterTreeByAllowedIds(domainTree, java.util.Collections.emptySet());
        }

        Set<Long> roleIds = userRoles.stream().map(SysUserRole::getRoleId).collect(Collectors.toSet());
        List<SysRole> roles = sysRoleMapper.selectBatchIds(roleIds);
        boolean isAdmin = roles.stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getRoleCode()));
        if (isAdmin) {
            return domainTree;
        }

        List<SysRoleMenu> roleMenus = sysRoleMenuMapper.selectList(
                new LambdaQueryWrapper<SysRoleMenu>().in(SysRoleMenu::getRoleId, roleIds));
        Set<Long> allowedMenuIds = roleMenus.stream()
                .map(SysRoleMenu::getMenuId)
                .collect(Collectors.toSet());

        return filterTreeByAllowedIds(domainTree, allowedMenuIds);
    }

    private List<NavMenu> filterTreeByAllowedIds(List<NavMenu> tree, Set<Long> allowedIds) {
        List<NavMenu> result = new ArrayList<>();
        for (NavMenu node : tree) {
            List<NavMenu> filteredChildren = node.getChildren() != null
                    ? filterTreeByAllowedIds(node.getChildren(), allowedIds)
                    : new ArrayList<>();

            if (allowedIds.contains(node.getId())) {
                node.setChildren(filteredChildren);
                result.add(node);
            } else if (!filteredChildren.isEmpty()) {
                node.setChildren(filteredChildren);
                result.add(node);
            }
        }
        return result;
    }

    private Long getEffectiveParentMenuId(SysDomainMenu dm,
                                          Map<Long, SysDomainMenu> domainMenuByMenuId,
                                          Map<Long, SysDomainMenu> domainMenuById,
                                          Map<Long, NavMenu> menuMap) {
        if (dm.getCustomParentId() != null) {
            if (dm.getCustomParentId() == 0) {
                return null;
            }
            SysDomainMenu parentDm = domainMenuByMenuId.get(dm.getCustomParentId());
            return parentDm != null ? parentDm.getMenuId() : null;
        }

        NavMenu navMenu = menuMap.get(dm.getMenuId());
        if (navMenu == null || navMenu.getParentId() == null || navMenu.getParentId() == 0) {
            return null;
        }

        if (domainMenuByMenuId.containsKey(navMenu.getParentId()) || menuMap.containsKey(navMenu.getParentId())) {
            return navMenu.getParentId();
        }

        return null;
    }

    private List<NavMenu> buildDomainTree(List<NavMenu> nodes,
                                          Map<Long, List<Long>> childrenMap,
                                          Map<Long, NavMenu> menuMap,
                                          Map<Long, SysDomainMenu> domainMenuByMenuId,
                                          boolean isRootLevel) {
        List<NavMenu> result = new ArrayList<>();
        for (NavMenu node : nodes) {
            SysDomainMenu dm = domainMenuByMenuId.get(node.getId());
            if (dm != null && dm.getCustomLabel() != null && !dm.getCustomLabel().isEmpty()) {
                node.setLabel(dm.getCustomLabel());
            }

            if (isRootLevel) {
                node.setParentId(0L);
            }

            List<Long> childMenuIds = childrenMap.getOrDefault(node.getId(), new ArrayList<>());
            if (!childMenuIds.isEmpty()) {
                List<NavMenu> children = childMenuIds.stream()
                        .map(menuMap::get)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
                node.setChildren(buildDomainTree(children, childrenMap, menuMap, domainMenuByMenuId, false));
            } else {
                node.setChildren(null);
            }
            result.add(node);
        }
        return result;
    }

    private List<NavMenu> buildTreeRecursive(List<NavMenu> nodes, Map<Long, List<NavMenu>> childrenMap) {
        List<NavMenu> result = new ArrayList<>();
        for (NavMenu node : nodes) {
            List<NavMenu> children = childrenMap.getOrDefault(node.getId(), new ArrayList<>());
            if (!children.isEmpty()) {
                node.setChildren(buildTreeRecursive(children, childrenMap));
            }
            result.add(node);
        }
        return result;
    }

    @Override
    public List<NavMenu> getTreeListByParentId(Long parentId) {
        return list(new LambdaQueryWrapper<NavMenu>()
                .eq(NavMenu::getParentId, parentId)
                .orderByAsc(NavMenu::getSort));
    }

    @Override
    public void batchUpdateStatus(List<Long> ids, Integer status) {
        for (Long id : ids) {
            NavMenu menu = new NavMenu();
            menu.setId(id);
            menu.setStatus(status);
            updateById(menu);
        }
    }

    @Override
    public void batchDelete(List<Long> ids) {
        // 收集所有子孙菜单ID
        List<Long> allIds = new ArrayList<>(ids);
        for (Long id : ids) {
            collectDescendantIds(id, allIds);
        }

        sysDomainMenuMapper.delete(new LambdaQueryWrapper<SysDomainMenu>()
                .in(SysDomainMenu::getMenuId, allIds));
        sysRoleMenuMapper.delete(new LambdaQueryWrapper<SysRoleMenu>()
                .in(SysRoleMenu::getMenuId, allIds));
        removeBatchByIds(allIds);
    }

    @Override
    public int calculateLevel(Long parentId) {
        if (parentId == null || parentId == 0) {
            return 0;
        }
        NavMenu parent = getById(parentId);
        if (parent == null) {
            return 0;
        }
        return (parent.getLevel() != null ? parent.getLevel() : 0) + 1;
    }

    @Override
    public boolean save(NavMenu entity) {
        boolean result = super.save(entity);
        if (result && entity.getId() != null) {
            syncMenuToDefaultDomain(entity);
        }
        return result;
    }

    @Override
    public boolean updateById(NavMenu entity) {
        boolean result = super.updateById(entity);
        if (result && entity.getId() != null) {
            syncDefaultDomainLabel(entity);
        }
        return result;
    }

    private void syncDefaultDomainLabel(NavMenu menu) {
        if (menu.getLabel() == null) return;
        LambdaQueryWrapper<SysDomain> domainQuery = new LambdaQueryWrapper<>();
        domainQuery.eq(SysDomain::getStatus, 1)
                   .eq(SysDomain::getIsDefault, 1);
        List<SysDomain> defaultDomains = sysDomainMapper.selectList(domainQuery);

        for (SysDomain domain : defaultDomains) {
            SysDomainMenu update = new SysDomainMenu();
            update.setCustomLabel(menu.getLabel());
            sysDomainMenuMapper.update(update, new LambdaQueryWrapper<SysDomainMenu>()
                    .eq(SysDomainMenu::getDomainId, domain.getId())
                    .eq(SysDomainMenu::getMenuId, menu.getId()));
        }
    }

    @Override
    public boolean removeById(java.io.Serializable id) {
        // 收集所有子孙菜单ID
        List<Long> allIds = new ArrayList<>();
        collectDescendantIds((Long) id, allIds);
        allIds.add((Long) id);

        // 批量逻辑删除
        boolean result = super.removeById(id);
        if (result) {
            // 级联逻辑删除子孙菜单
            for (int i = 1; i < allIds.size(); i++) {
                super.removeById(allIds.get(i));
            }
            // 清理域菜单关联
            sysDomainMenuMapper.delete(new LambdaQueryWrapper<SysDomainMenu>()
                    .in(SysDomainMenu::getMenuId, allIds));
            // 清理角色权限关联
            sysRoleMenuMapper.delete(new LambdaQueryWrapper<SysRoleMenu>()
                    .in(SysRoleMenu::getMenuId, allIds));
        }
        return result;
    }

    private void collectDescendantIds(Long parentId, List<Long> ids) {
        List<NavMenu> children = list(new LambdaQueryWrapper<NavMenu>()
                .eq(NavMenu::getParentId, parentId)
                .eq(NavMenu::getDeleted, 0));
        for (NavMenu child : children) {
            ids.add(child.getId());
            collectDescendantIds(child.getId(), ids);
        }
    }

    private void syncMenuToDefaultDomain(NavMenu menu) {
        LambdaQueryWrapper<SysDomain> domainQuery = new LambdaQueryWrapper<>();
        domainQuery.eq(SysDomain::getStatus, 1)
                   .eq(SysDomain::getIsDefault, 1);
        List<SysDomain> defaultDomains = sysDomainMapper.selectList(domainQuery);

        for (SysDomain domain : defaultDomains) {
            LambdaQueryWrapper<SysDomainMenu> checkQuery = new LambdaQueryWrapper<>();
            checkQuery.eq(SysDomainMenu::getDomainId, domain.getId())
                      .eq(SysDomainMenu::getMenuId, menu.getId());
            if (sysDomainMenuMapper.selectCount(checkQuery) == 0) {
                SysDomainMenu domainMenu = new SysDomainMenu();
                domainMenu.setDomainId(domain.getId());
                domainMenu.setMenuId(menu.getId());
                domainMenu.setCustomLabel(menu.getLabel());
                domainMenu.setSort(menu.getSort());
                sysDomainMenuMapper.insert(domainMenu);
            }
        }
    }
}
