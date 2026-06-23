package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.dto.CraftsmanApplicationCreateDTO;
import com.material.server.entity.CraftsmanApplication;
import com.material.server.service.CraftsmanApplicationService;
import com.material.server.vo.CraftsmanApplicationVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 工匠申请
 * 业务流程：新增工匠先进入申请单 → 审批通过后写入 craftsman 主表
 */
@RestController
@RequestMapping("/api/craftsman-applications")
@RequiredArgsConstructor
public class CraftsmanApplicationController {

    private final CraftsmanApplicationService craftsmanApplicationService;

    @GetMapping
    public Result<PageResult<CraftsmanApplicationVO>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String applicationNo,
            @RequestParam(required = false) String applicationType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String userAccount,
            @RequestParam(required = false) String serviceProviderName,
            @RequestParam(required = false) String applicant,
            @RequestParam(required = false) String applyTime) {

        Page<CraftsmanApplication> page = new Page<>(current, size);
        LambdaQueryWrapper<CraftsmanApplication> query = new LambdaQueryWrapper<>();
        if (applicationNo != null && !applicationNo.isEmpty()) {
            query.like(CraftsmanApplication::getApplicationNo, applicationNo);
        }
        if (applicationType != null && !applicationType.isEmpty()) {
            query.eq(CraftsmanApplication::getApplicationType, applicationType);
        }
        if (status != null && !status.isEmpty()) {
            query.eq(CraftsmanApplication::getStatus, status);
        }
        if (name != null && !name.isEmpty()) {
            query.like(CraftsmanApplication::getName, name);
        }
        if (phone != null && !phone.isEmpty()) {
            query.like(CraftsmanApplication::getPhone, phone);
        }
        if (userAccount != null && !userAccount.isEmpty()) {
            query.like(CraftsmanApplication::getUserAccount, userAccount);
        }
        if (serviceProviderName != null && !serviceProviderName.isEmpty()) {
            query.like(CraftsmanApplication::getServiceProviderName, serviceProviderName);
        }
        if (applicant != null && !applicant.isEmpty()) {
            query.like(CraftsmanApplication::getApplicant, applicant);
        }
        if (applyTime != null && !applyTime.isEmpty()) {
            query.like(CraftsmanApplication::getApplyTime, applyTime);
        }
        query.orderByDesc(CraftsmanApplication::getCreateTime);

        Page<CraftsmanApplication> result = craftsmanApplicationService.page(page, query);
        long total = craftsmanApplicationService.count(query);

        List<CraftsmanApplicationVO> records = result.getRecords().stream()
                .map(this::toVO)
                .collect(Collectors.toList());

        PageResult<CraftsmanApplicationVO> pageResult = PageResult.of(records, total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<CraftsmanApplicationVO> detail(@PathVariable Long id) {
        CraftsmanApplication entity = craftsmanApplicationService.getById(id);
        return Result.success(entity == null ? null : toVO(entity));
    }

    @PostMapping
    public Result<Long> create(@RequestBody CraftsmanApplicationCreateDTO dto) {
        CraftsmanApplicationVO vo = craftsmanApplicationService.createApplication(dto);
        return Result.success(vo.getId());
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody CraftsmanApplicationCreateDTO dto) {
        craftsmanApplicationService.updateApplication(id, dto);
        return Result.success();
    }

    @PutMapping("/{id}/submit")
    public Result<Void> submit(@PathVariable Long id) {
        craftsmanApplicationService.submit(id);
        return Result.success();
    }

    @PutMapping("/{id}/revoke")
    public Result<Void> revoke(@PathVariable Long id) {
        craftsmanApplicationService.revoke(id);
        return Result.success();
    }

    @PutMapping("/{id}/approve")
    public Result<Long> approve(@PathVariable Long id) {
        Long craftsmanId = craftsmanApplicationService.approve(id);
        return Result.success(craftsmanId);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        craftsmanApplicationService.delete(id);
        return Result.success();
    }

    private CraftsmanApplicationVO toVO(CraftsmanApplication entity) {
        CraftsmanApplicationVO vo = new CraftsmanApplicationVO();
        vo.setId(entity.getId());
        vo.setApplicationNo(entity.getApplicationNo());
        vo.setApplicationType(entity.getApplicationType());
        vo.setStatus(entity.getStatus());
        vo.setName(entity.getName());
        vo.setPhone(entity.getPhone());
        vo.setUserAccount(entity.getUserAccount());
        vo.setServiceProviderName(entity.getServiceProviderName());
        vo.setApplicant(entity.getApplicant());
        vo.setApplyTime(entity.getApplyTime());
        vo.setRejectReason(entity.getRejectReason());
        vo.setFormData(entity.getFormData());
        vo.setCreateTime(entity.getCreateTime());
        vo.setUpdateTime(entity.getUpdateTime());
        return vo;
    }
}
