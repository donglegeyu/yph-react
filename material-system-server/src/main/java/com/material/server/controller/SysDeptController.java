package com.material.server.controller;

import com.material.server.entity.SysDept;
import com.material.server.service.SysDeptService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sys/depts")
@RequiredArgsConstructor
public class SysDeptController {

    private final SysDeptService sysDeptService;

    @GetMapping
    public Map<String, Object> tree(
            @RequestParam(required = false) String deptName,
            @RequestParam(required = false) Integer status) {
        List<SysDept> tree = sysDeptService.listTree(deptName, status);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", tree);
        return response;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody SysDept dept) {
        SysDept created = sysDeptService.create(dept);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", created.getId());
        return response;
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody SysDept dept) {
        sysDeptService.update(id, dept);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        sysDeptService.updateStatus(id, body.get("status"));
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            sysDeptService.removeWithCheck(id);
            response.put("code", 200);
        } catch (IllegalStateException e) {
            response.put("code", 500);
            response.put("message", e.getMessage());
        }
        return response;
    }
}
