package com.material.server.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.dto.SysUserVO;
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
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Long deptId) {
        Page<SysUser> page = new Page<>(current, size);
        IPage<SysUserVO> result = sysUserService.page(page, username, status, deptId);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", result.getRecords());
        response.put("total", result.getTotal());
        response.put("current", result.getCurrent());
        response.put("size", result.getSize());
        return response;
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id) {
        SysUserVO vo = sysUserService.getDetailById(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", vo);
        return response;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> body) {
        SysUser user = new SysUser();
        user.setUsername((String) body.get("username"));
        user.setPassword((String) body.get("password"));
        user.setNickname((String) body.get("nickname"));
        user.setRealName((String) body.get("realName"));
        user.setPhone((String) body.get("phone"));
        user.setEmail((String) body.get("email"));
        user.setStatus(body.get("status") == null ? 1 : ((Number) body.get("status")).intValue());
        Object deptIdObj = body.get("deptId");
        if (deptIdObj != null) {
            user.setDeptId(((Number) deptIdObj).longValue());
        }
        List<Long> roleIds = extractLongList(body.get("roleIds"));
        sysUserService.create(user, roleIds);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", user.getId());
        return response;
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        SysUser user = new SysUser();
        user.setUsername((String) body.get("username"));
        user.setPassword((String) body.get("password"));
        user.setNickname((String) body.get("nickname"));
        user.setRealName((String) body.get("realName"));
        user.setPhone((String) body.get("phone"));
        user.setEmail((String) body.get("email"));
        if (body.get("status") != null) {
            user.setStatus(((Number) body.get("status")).intValue());
        }
        Object deptIdObj = body.get("deptId");
        if (deptIdObj != null) {
            user.setDeptId(((Number) deptIdObj).longValue());
        }
        List<Long> roleIds = extractLongList(body.get("roleIds"));
        sysUserService.update(id, user, roleIds);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @SuppressWarnings("unchecked")
    private List<Long> extractLongList(Object obj) {
        if (obj == null) return null;
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            return list.stream()
                    .filter(java.util.Objects::nonNull)
                    .map(item -> item instanceof Number
                            ? ((Number) item).longValue()
                            : Long.parseLong(String.valueOf(item)))
                    .toList();
        }
        return null;
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        sysUserService.updateStatus(id, body.get("status"));
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        return response;
    }

    @PutMapping("/{id}/reset-password")
    public Map<String, Object> resetPassword(@PathVariable Long id) {
        sysUserService.resetPassword(id);
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", "123123");
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
