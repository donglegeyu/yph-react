package com.material.approval.controller;

import com.material.approval.auth.RequirePerm;
import com.material.approval.common.ApiResult;
import com.material.approval.dto.ProcessDefVO;
import com.material.approval.service.ApprovalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/approval/process-definitions")
public class ProcessDefinitionController {

    private final ApprovalService approvalService;

    public ProcessDefinitionController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping
    @RequirePerm("approval:process:view")
    public ApiResult<List<ProcessDefVO>> list() {
        return ApiResult.ok(approvalService.processDefinitions());
    }
}
