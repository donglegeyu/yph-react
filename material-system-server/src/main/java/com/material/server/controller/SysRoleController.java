package com.material.server.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.entity.SysRole;
import com.material.server.service.SysRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sys/roles")
@RequiredArgsConstructor
public class SysRoleController {

    private final SysRoleService sysRoleService;

    @GetMapping
    public Map<String, Object> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String roleName,
            @RequestParam(required = false) Integer status) {
        Page<SysRole> page = new Page<>(current, size);
        IPage<SysRole> result = sysRoleService.page(page, roleName, status);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", result.getRecords());
        response.put("total", result.getTotal());
        response.put("current", result.getCurrent());
        response.put("size", result.getSize());
        return response;
    }

    @GetMapping("/all")
    public Map<String, Object> listAll() {
        List<SysRole> list = sysRoleService.listAll();
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", list);
        return response;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody SysRole role) {
        SysRole created = sysRoleService.create(role);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", created.getId());
        return response;
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody SysRole role) {
        sysRoleService.update(id, role);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        sysRoleService.updateStatus(id, body.get("status"));
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @GetMapping("/{id}/menus")
    public Map<String, Object> getRoleMenuIds(@PathVariable Long id) {
        List<Long> menuIds = sysRoleService.getRoleMenuIds(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", menuIds);
        return response;
    }

    @PutMapping("/{id}/menus")
    public Map<String, Object> assignMenus(@PathVariable Long id, @RequestBody Map<String, List<Long>> body) {
        sysRoleService.assignMenus(id, body.get("menuIds"));
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @GetMapping("/{id}/data-scope")
    public Map<String, Object> getRoleDataScope(@PathVariable Long id) {
        List<Long> deptIds = sysRoleService.getRoleDeptIds(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", deptIds);
        return response;
    }

    @PutMapping("/{id}/data-scope")
    public Map<String, Object> assignDataScope(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Integer dataScope = (Integer) body.get("dataScope");
        @SuppressWarnings("unchecked")
        List<Integer> deptIdInts = (List<Integer>) body.get("deptIds");
        List<Long> deptIds = deptIdInts == null ? null
                : deptIdInts.stream().map(Integer::longValue).toList();
        sysRoleService.assignDataScope(id, dataScope, deptIds);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            sysRoleService.removeWithCheck(id);
            response.put("code", 200);
        } catch (IllegalStateException e) {
            response.put("code", 500);
            response.put("message", e.getMessage());
        }
        return response;
    }
}
