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
            @RequestParam(required = false) String orderCode,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String checkStatus,
            @RequestParam(required = false) String visitResult,
            @RequestParam(required = false) String checkUser,
            @RequestParam(required = false) String hasDanger,
            @RequestParam(required = false) String maxDangerLevel,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String checkArea,
            @RequestParam(required = false) String checkCategory,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String checkResult,
            @RequestParam(required = false) String status) {

        Page<SecurityCheck> page = new Page<>(current, size);
        LambdaQueryWrapper<SecurityCheck> query = new LambdaQueryWrapper<>();
        if (gasCode != null && !gasCode.isEmpty()) {
            query.like(SecurityCheck::getGasCode, gasCode);
        }
        if (orderCode != null && !orderCode.isEmpty()) {
            query.like(SecurityCheck::getOrderCode, orderCode);
        }
        if (customerName != null && !customerName.isEmpty()) {
            query.like(SecurityCheck::getCustomerName, customerName);
        }
        if (checkStatus != null && !checkStatus.isEmpty()) {
            query.eq(SecurityCheck::getCheckStatus, checkStatus);
        }
        if (visitResult != null && !visitResult.isEmpty()) {
            query.eq(SecurityCheck::getVisitResult, visitResult);
        }
        if (checkUser != null && !checkUser.isEmpty()) {
            query.like(SecurityCheck::getCheckUser, checkUser);
        }
        if (hasDanger != null && !hasDanger.isEmpty()) {
            query.eq(SecurityCheck::getHasDanger, hasDanger);
        }
        if (maxDangerLevel != null && !maxDangerLevel.isEmpty()) {
            query.eq(SecurityCheck::getMaxDangerLevel, maxDangerLevel);
        }
        if (company != null && !company.isEmpty()) {
            query.like(SecurityCheck::getCompany, company);
        }
        if (checkArea != null && !checkArea.isEmpty()) {
            query.like(SecurityCheck::getCheckArea, checkArea);
        }
        if (checkCategory != null && !checkCategory.isEmpty()) {
            query.like(SecurityCheck::getCheckCategory, checkCategory);
        }
        if (address != null && !address.isEmpty()) {
            query.like(SecurityCheck::getAddress, address);
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
