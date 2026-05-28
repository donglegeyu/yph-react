package com.material.server.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.entity.SysUser;
import com.material.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sys/users")
@RequiredArgsConstructor
public class SysUserController {

    private final SysUserService sysUserService;

    @GetMapping
    public Map<String, Object> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) Integer status) {
        Page<SysUser> page = new Page<>(current, size);
        IPage<SysUser> result = sysUserService.page(page, username, status);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", result.getRecords());
        response.put("total", result.getTotal());
        response.put("current", result.getCurrent());
        response.put("size", result.getSize());
        return response;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody SysUser user) {
        sysUserService.create(user);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", user.getId());
        return response;
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody SysUser user) {
        sysUserService.update(id, user);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        sysUserService.updateStatus(id, body.get("status"));
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @PutMapping("/{id}/domains")
    public Map<String, Object> assignDomains(@PathVariable Long id, @RequestBody Map<String, Long[]> body) {
        sysUserService.assignDomains(id, body.get("domainIds"));
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @GetMapping("/{id}/domains")
    public Map<String, Object> getUserDomains(@PathVariable Long id) {
        List<?> domains = sysUserService.getUserDomains(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", domains);
        return response;
    }
}
