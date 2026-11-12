package com.material.approval.controller;

import com.material.approval.auth.RequirePerm;
import com.material.approval.auth.UserContext;
import com.material.approval.common.ApiResult;
import com.material.approval.common.PageData;
import com.material.approval.dto.ActionRequest;
import com.material.approval.dto.TaskDetailVO;
import com.material.approval.dto.TaskVO;
import com.material.approval.dto.TransferRequest;
import com.material.approval.service.ApprovalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/approval/tasks")
public class TaskController {

    private final ApprovalService approvalService;

    public TaskController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping("/todo")
    @RequirePerm("approval:todo:view")
    public ApiResult<PageData<TaskVO>> todo(
            @RequestParam(defaultValue = "1") long current,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String keyword) {
        return ApiResult.ok(approvalService.todo(UserContext.require(), keyword, current, size));
    }

    @GetMapping("/{taskId}")
    @RequirePerm("approval:todo:view")
    public ApiResult<TaskDetailVO> detail(@PathVariable String taskId) {
        return ApiResult.ok(approvalService.taskDetail(UserContext.require(), taskId));
    }

    @PostMapping("/{taskId}/approve")
    @RequirePerm("approval:todo:approve")
    public ApiResult<Void> approve(@PathVariable String taskId, @RequestBody(required = false) ActionRequest request) {
        approvalService.approve(UserContext.require(), taskId, request);
        return ApiResult.ok(null);
    }

    @PostMapping("/{taskId}/reject")
    @RequirePerm("approval:todo:reject")
    public ApiResult<Void> reject(@PathVariable String taskId, @RequestBody(required = false) ActionRequest request) {
        approvalService.reject(UserContext.require(), taskId, request);
        return ApiResult.ok(null);
    }

    @PostMapping("/{taskId}/transfer")
    @RequirePerm("approval:todo:approve")
    public ApiResult<Void> transfer(@PathVariable String taskId, @RequestBody(required = false) TransferRequest request) {
        approvalService.transfer(UserContext.require(), taskId, request);
        return ApiResult.ok(null);
    }

    @PostMapping("/{taskId}/add-sign")
    @RequirePerm("approval:todo:approve")
    public ApiResult<Void> addSign(@PathVariable String taskId, @RequestBody(required = false) TransferRequest request) {
        approvalService.addSign(UserContext.require(), taskId, request);
        return ApiResult.ok(null);
    }
}
