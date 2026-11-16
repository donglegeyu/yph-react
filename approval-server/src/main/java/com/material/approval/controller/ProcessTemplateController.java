package com.material.approval.controller;

import com.material.approval.auth.RequirePerm;
import com.material.approval.common.ApiResult;
import com.material.approval.dto.DeployResultVO;
import com.material.approval.dto.ProcessTemplateVO;
import com.material.approval.service.ApprovalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 内置流程模板：列表 + 从模板创建流程部署 */
@RestController
@RequestMapping("/api/approval/process-templates")
public class ProcessTemplateController {

    private final ApprovalService approvalService;

    public ProcessTemplateController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping
    @RequirePerm("approval:process:view")
    public ApiResult<List<ProcessTemplateVO>> list() {
        return ApiResult.ok(approvalService.processTemplates());
    }

    @PostMapping("/{templateKey}/deploy")
    @RequirePerm("approval:process:publish")
    public ApiResult<DeployResultVO> deploy(@PathVariable String templateKey,
                                            @RequestParam String name,
                                            @RequestParam(required = false) String processKey) {
        return ApiResult.ok(approvalService.deployFromTemplate(templateKey, name, processKey));
    }
}
