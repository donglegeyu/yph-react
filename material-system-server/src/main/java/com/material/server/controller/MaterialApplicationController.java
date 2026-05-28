package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.entity.MaterialApplication;
import com.material.server.service.MaterialApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class MaterialApplicationController {

    private final MaterialApplicationService materialApplicationService;

    @GetMapping
    public Result<PageResult<MaterialApplication>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String applicationNo,
            @RequestParam(required = false) String materialName,
            @RequestParam(required = false) String spec,
            @RequestParam(required = false) String unit,
            @RequestParam(required = false) String applicant,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        Page<MaterialApplication> page = new Page<>(current, size);
        LambdaQueryWrapper<MaterialApplication> query = buildQueryWrapper(
                applicationNo, materialName, spec, unit, applicant, status, department, startDate, endDate);
        query.orderByDesc(MaterialApplication::getApplyTime);

        Page<MaterialApplication> result = materialApplicationService.page(page, query);
        long total = materialApplicationService.count(query);

        PageResult<MaterialApplication> pageResult = PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }

    private LambdaQueryWrapper<MaterialApplication> buildQueryWrapper(
            String applicationNo, String materialName, String spec, String unit,
            String applicant, String status, String department,
            String startDate, String endDate) {
        
        LambdaQueryWrapper<MaterialApplication> query = new LambdaQueryWrapper<>();
        
        if (applicationNo != null && !applicationNo.isEmpty()) {
            query.like(MaterialApplication::getApplicationNo, applicationNo);
        }
        if (materialName != null && !materialName.isEmpty()) {
            query.like(MaterialApplication::getMaterialName, materialName);
        }
        if (spec != null && !spec.isEmpty()) {
            query.like(MaterialApplication::getSpec, spec);
        }
        if (unit != null && !unit.isEmpty()) {
            query.eq(MaterialApplication::getUnit, unit);
        }
        if (applicant != null && !applicant.isEmpty()) {
            query.like(MaterialApplication::getApplicant, applicant);
        }
        if (status != null && !status.isEmpty()) {
            query.eq(MaterialApplication::getStatus, status);
        }
        if (department != null && !department.isEmpty()) {
            query.eq(MaterialApplication::getDepartment, department);
        }
        if (startDate != null && !startDate.isEmpty()) {
            query.ge(MaterialApplication::getApplyTime, startDate);
        }
        if (endDate != null && !endDate.isEmpty()) {
            query.le(MaterialApplication::getApplyTime, endDate + " 23:59:59");
        }
        
        return query;
    }

    @GetMapping("/{id}")
    public Result<MaterialApplication> detail(@PathVariable Long id) {
        MaterialApplication material = materialApplicationService.getById(id);
        return Result.success(material);
    }

    @PostMapping
    public Result<Long> create(@RequestBody MaterialApplication material) {
        materialApplicationService.save(material);
        return Result.success(material.getId());
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody MaterialApplication material) {
        material.setId(id);
        materialApplicationService.updateById(material);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        materialApplicationService.removeById(id);
        return Result.success();
    }

    @GetMapping("/options")
    public Result<Map<String, List<Map<String, String>>>> options() {
        Map<String, List<Map<String, String>>> data = new HashMap<>();
        
        data.put("status", List.of(
                Map.of("value", "draft", "label", "草稿"),
                Map.of("value", "pending", "label", "待审批"),
                Map.of("value", "approved", "label", "已通过"),
                Map.of("value", "rejected", "label", "已拒绝")
        ));
        
        data.put("department", List.of(
                Map.of("value", "engineering", "label", "工程部"),
                Map.of("value", "procurement", "label", "采购部"),
                Map.of("value", "finance", "label", "财务部")
        ));
        
        return Result.success(data);
    }
}
