package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysDomainMenu;
import com.material.server.entity.SysUser;
import com.material.server.entity.SysUserDomain;
import com.material.server.mapper.SysDomainMapper;
import com.material.server.mapper.SysUserDomainMapper;
import com.material.server.mapper.SysUserMapper;
import com.material.server.service.NavMenuService;
import com.material.server.service.SysDomainMenuService;
import com.material.server.service.SysDomainService;
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

    @GetMapping("/users/{id}/permissions")
    public Map<String, Object> getUserPermissions(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();

        SysUser user = sysUserService.getById(id);
        result.put("user", user);

        List<SysDomain> domains = sysDomainService.getByUserId(id);
        result.put("domains", domains);

        Set<Long> allMenuIds = new HashSet<>();
        for (SysDomain domain : domains) {
            List<SysDomainMenu> domainMenus = sysDomainMenuService.getByDomainId(domain.getId());
            for (SysDomainMenu dm : domainMenus) {
                allMenuIds.add(dm.getMenuId());
            }
        }

        List<?> menuTree = navMenuService.getTreeList();
        result.put("menuTree", menuTree);

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
