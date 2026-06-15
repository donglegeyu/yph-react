package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.dto.SysUserVO;
import com.material.server.entity.*;
import com.material.server.mapper.*;
import com.material.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {

    private final SysUserDomainMapper sysUserDomainMapper;
    private final SysDomainMapper sysDomainMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final SysRoleMapper sysRoleMapper;
    private final SysDeptMapper sysDeptMapper;

    @Override
    public IPage<SysUserVO> page(Page<SysUser> page, String username, Integer status, Long deptId) {
        LambdaQueryWrapper<SysUser> query = new LambdaQueryWrapper<>();
        if (username != null && !username.isEmpty()) {
            query.like(SysUser::getUsername, username);
        }
        if (status != null) {
            query.eq(SysUser::getStatus, status);
        }
        if (deptId != null) {
            query.eq(SysUser::getDeptId, deptId);
        }
        query.orderByDesc(SysUser::getCreateTime);
        IPage<SysUser> userPage = this.baseMapper.selectPage(page, query);

        List<SysUser> users = userPage.getRecords();
        IPage<SysUserVO> voPage = userPage.convert(user -> {
            SysUserVO vo = new SysUserVO();
            vo.setId(user.getId());
            vo.setUsername(user.getUsername());
            vo.setNickname(user.getNickname());
            vo.setRealName(user.getRealName());
            vo.setDeptId(user.getDeptId());
            vo.setPhone(user.getPhone());
            vo.setEmail(user.getEmail());
            vo.setStatus(user.getStatus());
            vo.setLastLoginTime(user.getLastLoginTime());
            vo.setLastLoginIp(user.getLastLoginIp());
            vo.setCreateTime(user.getCreateTime());
            vo.setUpdateTime(user.getUpdateTime());
            return vo;
        });

        if (users.isEmpty()) {
            voPage.getRecords().forEach(vo -> {
                vo.setDomains(Collections.emptyList());
                vo.setRoles(Collections.emptyList());
            });
            return voPage;
        }

        List<Long> userIds = users.stream().map(SysUser::getId).collect(Collectors.toList());

        // ---- 部门名称 + 公司(根节点)名称 ----
        List<Long> deptIds = users.stream()
                .map(SysUser::getDeptId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, SysDept> deptIdToEntity;
        if (deptIds.isEmpty()) {
            deptIdToEntity = Collections.emptyMap();
        } else {
            deptIdToEntity = sysDeptMapper.selectBatchIds(deptIds).stream()
                    .collect(Collectors.toMap(SysDept::getId, d -> d));
        }
        // 需要额外查询的祖先部门 ID（ancestors 里的根节点）
        Set<Long> ancestorIds = new HashSet<>();
        for (SysDept d : deptIdToEntity.values()) {
            if (d.getAncestors() != null && !d.getAncestors().isEmpty()) {
                for (String s : d.getAncestors().split(",")) {
                    try {
                        long aid = Long.parseLong(s.trim());
                        if (aid != 0L) ancestorIds.add(aid);
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        Map<Long, String> ancestorIdToName;
        if (ancestorIds.isEmpty()) {
            ancestorIdToName = Collections.emptyMap();
        } else {
            ancestorIdToName = sysDeptMapper.selectBatchIds(ancestorIds).stream()
                    .collect(Collectors.toMap(SysDept::getId, SysDept::getDeptName));
        }

        // ---- 关联域 ----
        LambdaQueryWrapper<SysUserDomain> userDomainQuery = new LambdaQueryWrapper<>();
        userDomainQuery.in(SysUserDomain::getUserId, userIds);
        List<SysUserDomain> userDomains = sysUserDomainMapper.selectList(userDomainQuery);
        Map<Long, List<Long>> userIdToDomainIds = userDomains.stream()
                .collect(Collectors.groupingBy(SysUserDomain::getUserId,
                        Collectors.mapping(SysUserDomain::getDomainId, Collectors.toList())));
        List<Long> allDomainIds = userDomains.stream()
                .map(SysUserDomain::getDomainId).distinct().collect(Collectors.toList());
        Map<Long, String> domainIdToName = allDomainIds.isEmpty()
                ? Collections.emptyMap()
                : sysDomainMapper.selectBatchIds(allDomainIds).stream()
                        .collect(Collectors.toMap(SysDomain::getId, SysDomain::getDomainName));

        // ---- 关联角色 ----
        LambdaQueryWrapper<SysUserRole> userRoleQuery = new LambdaQueryWrapper<>();
        userRoleQuery.in(SysUserRole::getUserId, userIds);
        List<SysUserRole> userRoles = sysUserRoleMapper.selectList(userRoleQuery);
        Map<Long, List<Long>> userIdToRoleIds = userRoles.stream()
                .collect(Collectors.groupingBy(SysUserRole::getUserId,
                        Collectors.mapping(SysUserRole::getRoleId, Collectors.toList())));
        List<Long> allRoleIds = userRoles.stream()
                .map(SysUserRole::getRoleId).distinct().collect(Collectors.toList());
        Map<Long, SysRole> roleIdToEntity = allRoleIds.isEmpty()
                ? Collections.emptyMap()
                : sysRoleMapper.selectBatchIds(allRoleIds).stream()
                        .collect(Collectors.toMap(SysRole::getId, r -> r));

        Map<Long, String> finalDomainIdToName = domainIdToName;
        Map<Long, SysRole> finalRoleIdToEntity = roleIdToEntity;
        Map<Long, SysDept> finalDeptIdToEntity = deptIdToEntity;
        Map<Long, String> finalAncestorIdToName = ancestorIdToName;
        voPage.getRecords().forEach(vo -> {
            if (vo.getDeptId() != null) {
                SysDept dept = finalDeptIdToEntity.get(vo.getDeptId());
                if (dept != null) {
                    vo.setDeptName(dept.getDeptName());
                    // 追溯公司：ancestors 的第一个非 0 节点即根部门（公司）
                    String ancestors = dept.getAncestors();
                    if (ancestors != null && !ancestors.isEmpty()) {
                        String[] parts = ancestors.split(",");
                        for (String p : parts) {
                            try {
                                long aid = Long.parseLong(p.trim());
                                if (aid != 0L) {
                                    vo.setCompanyId(aid);
                                    vo.setCompanyName(finalAncestorIdToName.get(aid));
                                    break;
                                }
                            } catch (NumberFormatException ignored) {
                            }
                        }
                    }
                    // 如果部门本身就是根（parent_id=0），它自己就是公司
                    if (vo.getCompanyId() == null && (dept.getParentId() == null || dept.getParentId() == 0L)) {
                        vo.setCompanyId(dept.getId());
                        vo.setCompanyName(dept.getDeptName());
                    }
                }
            }

            List<Long> domainIds = userIdToDomainIds.getOrDefault(vo.getId(), Collections.emptyList());
            vo.setDomains(domainIds.stream()
                    .map(did -> new SysUserVO.DomainBrief(did, finalDomainIdToName.getOrDefault(did, "未知域")))
                    .collect(Collectors.toList()));

            List<Long> roleIds = userIdToRoleIds.getOrDefault(vo.getId(), Collections.emptyList());
            vo.setRoles(roleIds.stream()
                    .map(rid -> {
                        SysRole r = finalRoleIdToEntity.get(rid);
                        return new SysUserVO.RoleBrief(rid,
                                r == null ? "未知角色" : r.getRoleName(),
                                r == null ? "" : r.getRoleCode());
                    })
                    .collect(Collectors.toList()));
        });

        return voPage;
    }

    @Override
    @Transactional
    public SysUser create(SysUser user, List<Long> roleIds) {
        save(user);
        replaceUserRoles(user.getId(), roleIds);
        return user;
    }

    @Override
    @Transactional
    public void update(Long id, SysUser user, List<Long> roleIds) {
        user.setId(id);
        // 密码为空则不更新密码
        if (user.getPassword() != null && user.getPassword().isEmpty()) {
            user.setPassword(null);
        }
        updateById(user);
        replaceUserRoles(id, roleIds);
    }

    private void replaceUserRoles(Long userId, List<Long> roleIds) {
        LambdaQueryWrapper<SysUserRole> query = new LambdaQueryWrapper<>();
        query.eq(SysUserRole::getUserId, userId);
        sysUserRoleMapper.delete(query);
        if (roleIds != null && !roleIds.isEmpty()) {
            roleIds.forEach(rid -> {
                SysUserRole ur = new SysUserRole();
                ur.setUserId(userId);
                ur.setRoleId(rid);
                sysUserRoleMapper.insert(ur);
            });
        }
    }

    @Override
    @Transactional
    public void updateStatus(Long id, Integer status) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);
        updateById(user);
    }

    @Override
    @Transactional
    public void assignDomains(Long userId, Long[] domainIds) {
        LambdaQueryWrapper<SysUserDomain> query = new LambdaQueryWrapper<>();
        query.eq(SysUserDomain::getUserId, userId);
        sysUserDomainMapper.delete(query);

        if (domainIds != null && domainIds.length > 0) {
            Arrays.stream(domainIds).forEach(domainId -> {
                SysUserDomain userDomain = new SysUserDomain();
                userDomain.setUserId(userId);
                userDomain.setDomainId(domainId);
                sysUserDomainMapper.insert(userDomain);
            });
        }
    }

    @Override
    public List<SysDomain> getUserDomains(Long userId) {
        LambdaQueryWrapper<SysUserDomain> query = new LambdaQueryWrapper<>();
        query.eq(SysUserDomain::getUserId, userId);
        List<SysUserDomain> userDomains = sysUserDomainMapper.selectList(query);

        if (userDomains.isEmpty()) {
            return List.of();
        }

        List<Long> domainIds = userDomains.stream()
                .map(SysUserDomain::getDomainId)
                .collect(Collectors.toList());

        return sysDomainMapper.selectBatchIds(domainIds);
    }
}
