package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.dto.UserPermissionVO;
import com.material.server.entity.*;
import com.material.server.mapper.SysDomainMapper;
import com.material.server.mapper.SysUserDomainMapper;
import com.material.server.mapper.SysUserMapper;
import com.material.server.service.NavMenuService;
import com.material.server.service.SysDomainMenuService;
import com.material.server.service.SysDomainService;
import com.material.server.service.SysPermissionService;
import com.material.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/sys")
@RequiredArgsConstructor
public class SysPermissionController {

    private final SysUserService sysUserService;
    private final SysDomainService sysDomainService;
    private final SysDomainMenuService sysDomainMenuService;
    private final SysUserDomainMapper sysUserDomainMapper;
    private final SysDomainMapper sysDomainMapper;
    private final SysUserMapper sysUserMapper;
    private final NavMenuService navMenuService;
    private final SysPermissionService sysPermissionService;

    @GetMapping("/users/{id}/permissions")
    public Map<String, Object> getUserPermissions(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();

        // 基础信息
        SysUser user = sysUserService.getById(id);
        result.put("user", user);

        // 关联域
        List<SysDomain> domains = sysDomainService.getByUserId(id);
        result.put("domains", domains);

        // 域维度菜单（保留原有逻辑）
        Set<Long> allMenuIds = new HashSet<>();
        for (SysDomain domain : domains) {
            List<SysDomainMenu> domainMenus = sysDomainMenuService.getByDomainId(domain.getId());
            for (SysDomainMenu dm : domainMenus) {
                allMenuIds.add(dm.getMenuId());
            }
        }
        List<?> menuTree = navMenuService.getTreeList();
        result.put("menuTree", menuTree);

        // RBAC 权限聚合（角色 + 菜单权限 + 按钮标识 + 数据范围）
        UserPermissionVO rbac = sysPermissionService.getUserPermissions(id);
        result.put("rbac", rbac);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", result);
        return response;
    }

    @GetMapping("/domains/{id}/users")
    public Map<String, Object> getDomainUsers(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();

        SysDomain domain = sysDomainService.getById(id);
        result.put("domain", domain);

        LambdaQueryWrapper<SysUserDomain> query = new LambdaQueryWrapper<>();
        query.eq(SysUserDomain::getDomainId, id);
        List<SysUserDomain> userDomains = sysUserDomainMapper.selectList(query);

        if (!userDomains.isEmpty()) {
            List<Long> userIds = userDomains.stream()
                    .map(SysUserDomain::getUserId)
                    .toList();
            List<SysUser> users = sysUserMapper.selectBatchIds(userIds);
            result.put("users", users);
        } else {
            result.put("users", List.of());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", result);
        return response;
    }
}
