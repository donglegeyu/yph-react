package com.material.approval.controller;

import com.material.approval.auth.RequirePerm;
import com.material.approval.auth.UserContext;
import com.material.approval.common.ApiResult;
import com.material.approval.common.PageData;
import com.material.approval.dto.ActionRequest;
import com.material.approval.dto.DoneTaskVO;
import com.material.approval.dto.InstanceDetailVO;
import com.material.approval.dto.InstanceVO;
import com.material.approval.dto.StartRequest;
import com.material.approval.service.ApprovalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/approval/instances")
public class InstanceController {

    private final ApprovalService approvalService;

    public InstanceController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping("/mine")
    @RequirePerm("approval:mine:view")
    public ApiResult<PageData<InstanceVO>> mine(
            @RequestParam(defaultValue = "1") long current,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String status) {
        return ApiResult.ok(approvalService.mine(UserContext.require(), status, current, size));
    }

    @GetMapping("/done")
    @RequirePerm("approval:done:view")
    public ApiResult<PageData<DoneTaskVO>> done(
            @RequestParam(defaultValue = "1") long current,
            @RequestParam(defaultValue = "10") long size) {
        return ApiResult.ok(approvalService.done(UserContext.require(), current, size));
    }

    @PostMapping
    @RequirePerm("approval:start:submit")
    public ApiResult<Map<String, String>> start(@RequestBody StartRequest request) {
        return ApiResult.ok(approvalService.start(UserContext.require(), request));
    }

    // 详情不做粗粒度 UI 权限校验：服务层已校验 管理员/发起人/已处理人/被抄送人，
    // 保证仅被抄送或仅已办的用户（无 approval:mine:view）也能查看被抄送/经办的实例
    @GetMapping("/{instanceId}")
    public ApiResult<InstanceDetailVO> detail(@PathVariable String instanceId) {
        return ApiResult.ok(approvalService.instanceDetail(UserContext.require(), instanceId));
    }

    @PostMapping("/{instanceId}/withdraw")
    @RequirePerm("approval:start:submit")
    public ApiResult<Void> withdraw(@PathVariable String instanceId, @RequestBody(required = false) ActionRequest request) {
        approvalService.withdraw(UserContext.require(), instanceId, request == null ? null : request.comment());
        return ApiResult.ok(null);
    }

    @PostMapping("/{instanceId}/urge")
    @RequirePerm("approval:start:submit")
    public ApiResult<Void> urge(@PathVariable String instanceId, @RequestBody(required = false) ActionRequest request) {
        approvalService.urge(UserContext.require(), instanceId, request == null ? null : request.comment());
        return ApiResult.ok(null);
    }
}
