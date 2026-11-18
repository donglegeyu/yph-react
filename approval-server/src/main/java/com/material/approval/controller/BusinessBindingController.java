package com.material.approval.controller;

import com.material.approval.auth.RequirePerm;
import com.material.approval.common.ApiResult;
import com.material.approval.service.BusinessBindingService;
import com.material.approval.service.BusinessBindingService.BindingRow;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** 业务流程绑定（审批绑定管理）：绑定 CRUD + 已注册业务类型白名单（供新增下拉） */
@RestController
@RequestMapping("/api/approval/business-bindings")
public class BusinessBindingController {

    private final BusinessBindingService bindingService;

    public BusinessBindingController(BusinessBindingService bindingService) {
        this.bindingService = bindingService;
    }

    @GetMapping
    @RequirePerm("approval:binding:view")
    public ApiResult<List<BindingRow>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String businessName,
            @RequestParam(required = false) String businessType,
            @RequestParam(required = false) String processKey,
            @RequestParam(required = false) String approvalMode,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) String updateTimeFrom,
            @RequestParam(required = false) String updateTimeTo) {
        // keyword 兼容旧用法：未传专属字段时按业务名称模糊匹配
        if (!StringUtils.hasText(businessName) && !StringUtils.hasText(businessType)
                && StringUtils.hasText(keyword)) {
            businessName = keyword;
        }
        return ApiResult.ok(bindingService.list(businessName, businessType, processKey,
                approvalMode, enabled, updateTimeFrom, updateTimeTo));
    }

    @PostMapping
    @RequirePerm("approval:binding:manage")
    public ApiResult<BindingRow> save(@RequestBody Map<String, Object> body) {
        return ApiResult.ok(bindingService.save(body));
    }

    @PutMapping("/{id}/enabled")
    @RequirePerm("approval:binding:manage")
    public ApiResult<Void> updateEnabled(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Object enabled = body.get("enabled");
        if (!(enabled instanceof Boolean value)) {
            throw new com.material.approval.common.BizException(400, "enabled 必须为布尔值");
        }
        bindingService.updateEnabled(id, value);
        return ApiResult.ok(null);
    }
}
