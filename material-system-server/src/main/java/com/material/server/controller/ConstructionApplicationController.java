package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.entity.ConstructionApplication;
import com.material.server.service.ConstructionApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/construction-applications")
@RequiredArgsConstructor
public class ConstructionApplicationController {

    private final ConstructionApplicationService constructionApplicationService;

    @GetMapping
    public Result<PageResult<ConstructionApplication>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String applicationNo,
            @RequestParam(required = false) String constructionName,
            @RequestParam(required = false) String applicant,
            @RequestParam(required = false) String status) {

        Page<ConstructionApplication> page = new Page<>(current, size);
        LambdaQueryWrapper<ConstructionApplication> query = new LambdaQueryWrapper<>();
        if (applicationNo != null && !applicationNo.isEmpty()) {
            query.like(ConstructionApplication::getApplicationNo, applicationNo);
        }
        if (constructionName != null && !constructionName.isEmpty()) {
            query.like(ConstructionApplication::getConstructionName, constructionName);
        }
        if (applicant != null && !applicant.isEmpty()) {
            query.like(ConstructionApplication::getApplicant, applicant);
        }
        if (status != null && !status.isEmpty()) {
            query.eq(ConstructionApplication::getStatus, status);
        }
        query.orderByDesc(ConstructionApplication::getApplyTime);

        Page<ConstructionApplication> result = constructionApplicationService.page(page, query);
        long total = constructionApplicationService.count(query);

        PageResult<ConstructionApplication> pageResult = PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<ConstructionApplication> detail(@PathVariable Long id) {
        ConstructionApplication application = constructionApplicationService.getById(id);
        return Result.success(application);
    }

    @PostMapping
    public Result<Long> create(@RequestBody ConstructionApplication application) {
        constructionApplicationService.save(application);
        return Result.success(application.getId());
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody ConstructionApplication application) {
        application.setId(id);
        constructionApplicationService.updateById(application);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        constructionApplicationService.removeById(id);
        return Result.success();
    }
}
