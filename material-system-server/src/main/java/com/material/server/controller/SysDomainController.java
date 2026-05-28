package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysDomainMenu;
import com.material.server.entity.SysUserDomain;
import com.material.server.mapper.SysDomainMenuMapper;
import com.material.server.mapper.SysUserDomainMapper;
import com.material.server.mapper.SysUserMapper;
import com.material.server.service.SysDomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sys/domains")
@RequiredArgsConstructor
public class SysDomainController {

    private final SysDomainService sysDomainService;
    private final SysDomainMenuMapper sysDomainMenuMapper;
    private final SysUserDomainMapper sysUserDomainMapper;
    private final SysUserMapper sysUserMapper;

    @GetMapping
    public Map<String, Object> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String domainName,
            @RequestParam(required = false) Integer status) {
        Page<SysDomain> page = new Page<>(current, size);
        IPage<SysDomain> result = sysDomainService.page(page, domainName, status);

        List<Map<String, Object>> dataWithCounts = new java.util.ArrayList<>();
        for (SysDomain domain : result.getRecords()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", domain.getId());
            item.put("domainKey", domain.getDomainKey());
            item.put("domainName", domain.getDomainName());
            item.put("description", domain.getDescription());
            item.put("isDefault", domain.getIsDefault());
            item.put("status", domain.getStatus());
            item.put("createTime", domain.getCreateTime());
            item.put("updateTime", domain.getUpdateTime());

            LambdaQueryWrapper<SysDomainMenu> menuQuery = new LambdaQueryWrapper<>();
            menuQuery.eq(SysDomainMenu::getDomainId, domain.getId());
            long menuCount = sysDomainMenuMapper.selectCount(menuQuery);
            item.put("menuCount", menuCount);

            LambdaQueryWrapper<SysUserDomain> userQuery = new LambdaQueryWrapper<>();
            userQuery.eq(SysUserDomain::getDomainId, domain.getId());
            long userCount = sysUserDomainMapper.selectCount(userQuery);
            item.put("userCount", userCount);

            dataWithCounts.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", dataWithCounts);
        response.put("total", result.getTotal());
        response.put("current", result.getCurrent());
        response.put("size", result.getSize());
        return response;
    }

    @GetMapping("/all")
    public Map<String, Object> getAll() {
        List<SysDomain> domains = sysDomainService.getAllEnabled();
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", domains);
        return response;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable Long id) {
        SysDomain domain = sysDomainService.getById(id);

        LambdaQueryWrapper<SysDomainMenu> menuQuery = new LambdaQueryWrapper<>();
        menuQuery.eq(SysDomainMenu::getDomainId, id);
        long menuCount = sysDomainMenuMapper.selectCount(menuQuery);

        LambdaQueryWrapper<SysUserDomain> userQuery = new LambdaQueryWrapper<>();
        userQuery.eq(SysUserDomain::getDomainId, id);
        long userCount = sysUserDomainMapper.selectCount(userQuery);

        Map<String, Object> result = new HashMap<>();
        result.put("id", domain.getId());
        result.put("domainKey", domain.getDomainKey());
        result.put("domainName", domain.getDomainName());
        result.put("description", domain.getDescription());
        result.put("isDefault", domain.getIsDefault());
        result.put("status", domain.getStatus());
        result.put("createTime", domain.getCreateTime());
        result.put("updateTime", domain.getUpdateTime());
        result.put("menuCount", menuCount);
        result.put("userCount", userCount);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", result);
        return response;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody SysDomain domain) {
        sysDomainService.create(domain);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", domain.getId());
        return response;
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody SysDomain domain) {
        sysDomainService.update(id, domain);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        sysDomainService.updateStatus(id, body.get("status"));
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        boolean success = sysDomainService.deleteDomain(id);
        Map<String, Object> response = new HashMap<>();
        if (success) {
            response.put("code", 200);
            response.put("message", "删除成功");
        } else {
            response.put("code", 500);
            response.put("message", "默认域不可删除");
        }
        return response;
    }
}
