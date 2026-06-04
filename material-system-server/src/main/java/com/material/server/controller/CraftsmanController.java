package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.entity.Craftsman;
import com.material.server.service.CraftsmanService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/craftsmen")
@RequiredArgsConstructor
public class CraftsmanController {

    private final CraftsmanService craftsmanService;

    @GetMapping
    public Result<PageResult<Craftsman>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String craftsmanCode,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String userAccount,
            @RequestParam(required = false) String serviceProviderName,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) Integer status) {

        Page<Craftsman> page = new Page<>(current, size);
        LambdaQueryWrapper<Craftsman> query = new LambdaQueryWrapper<>();
        if (craftsmanCode != null && !craftsmanCode.isEmpty()) {
            query.like(Craftsman::getCraftsmanCode, craftsmanCode);
        }
        if (name != null && !name.isEmpty()) {
            query.like(Craftsman::getName, name);
        }
        if (phone != null && !phone.isEmpty()) {
            query.like(Craftsman::getPhone, phone);
        }
        if (userAccount != null && !userAccount.isEmpty()) {
            query.like(Craftsman::getUserAccount, userAccount);
        }
        if (serviceProviderName != null && !serviceProviderName.isEmpty()) {
            query.like(Craftsman::getServiceProviderName, serviceProviderName);
        }
        if (type != null && !type.isEmpty()) {
            query.eq(Craftsman::getType, type);
        }
        if (region != null && !region.isEmpty()) {
            query.like(Craftsman::getRegion, region);
        }
        if (status != null) {
            query.eq(Craftsman::getStatus, status);
        }
        query.orderByDesc(Craftsman::getCreateTime);

        Page<Craftsman> result = craftsmanService.page(page, query);
        long total = craftsmanService.count(query);

        PageResult<Craftsman> pageResult = PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<Craftsman> detail(@PathVariable Long id) {
        Craftsman craftsman = craftsmanService.getById(id);
        return Result.success(craftsman);
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Craftsman request) {
        Craftsman craftsman = new Craftsman();
        craftsman.setId(id);
        craftsman.setStatus(request.getStatus());
        craftsmanService.updateById(craftsman);
        return Result.success();
    }
}
