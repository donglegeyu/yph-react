package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.entity.SecurityCheck;
import com.material.server.service.SecurityCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/security-checks")
@RequiredArgsConstructor
public class SecurityCheckController {

    private final SecurityCheckService securityCheckService;

    @GetMapping
    public Result<PageResult<SecurityCheck>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String gasCode,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String checkUser,
            @RequestParam(required = false) String checkResult,
            @RequestParam(required = false) String status) {

        Page<SecurityCheck> page = new Page<>(current, size);
        LambdaQueryWrapper<SecurityCheck> query = new LambdaQueryWrapper<>();
        if (gasCode != null && !gasCode.isEmpty()) {
            query.like(SecurityCheck::getGasCode, gasCode);
        }
        if (address != null && !address.isEmpty()) {
            query.like(SecurityCheck::getAddress, address);
        }
        if (checkUser != null && !checkUser.isEmpty()) {
            query.like(SecurityCheck::getCheckUser, checkUser);
        }
        if (checkResult != null && !checkResult.isEmpty()) {
            query.eq(SecurityCheck::getCheckResult, checkResult);
        }
        if (status != null && !status.isEmpty()) {
            query.eq(SecurityCheck::getStatus, status);
        }
        query.orderByDesc(SecurityCheck::getCheckDate);

        Page<SecurityCheck> result = securityCheckService.page(page, query);
        long total = securityCheckService.count(query);

        PageResult<SecurityCheck> pageResult = PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<SecurityCheck> detail(@PathVariable Long id) {
        SecurityCheck securityCheck = securityCheckService.getById(id);
        return Result.success(securityCheck);
    }
}
