package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.common.Result;
import com.material.server.entity.SysDataPermission;
import com.material.server.mapper.SysDataPermissionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sys/data-permissions")
@RequiredArgsConstructor
public class SysDataPermissionController {

    private final SysDataPermissionMapper sysDataPermissionMapper;

    @GetMapping
    public Result<List<SysDataPermission>> getByDomainId(@RequestParam(required = false) Long domainId) {
        LambdaQueryWrapper<SysDataPermission> query = new LambdaQueryWrapper<>();
        if (domainId != null) {
            query.eq(SysDataPermission::getDomainId, domainId);
        }
        List<SysDataPermission> list = sysDataPermissionMapper.selectList(query);
        return Result.success(list);
    }

    @PostMapping("/batch")
    public Result<Void> saveBatch(@RequestBody List<SysDataPermission> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            return Result.success();
        }
        Long domainId = permissions.get(0).getDomainId();
        if (domainId != null) {
            LambdaQueryWrapper<SysDataPermission> query = new LambdaQueryWrapper<>();
            query.eq(SysDataPermission::getDomainId, domainId);
            sysDataPermissionMapper.delete(query);
        }

        for (SysDataPermission permission : permissions) {
            permission.setId(null);
            sysDataPermissionMapper.insert(permission);
        }
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        sysDataPermissionMapper.deleteById(id);
        return Result.success();
    }
}
