package com.material.approval.controller;

import com.material.approval.auth.RequirePerm;
import com.material.approval.common.ApiResult;
import com.material.approval.common.BizException;
import com.material.approval.dto.ProcessDefVO;
import com.material.approval.service.ApprovalService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
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

    @GetMapping("/{definitionId}/xml")
    @RequirePerm("approval:process:view")
    public ApiResult<String> xml(@PathVariable String definitionId) {
        return ApiResult.ok(approvalService.processDefinitionXml(definitionId));
    }

    /** 流程图返回 PNG 裸字节，不包 ApiResult（前端以 blob 处理） */
    @GetMapping("/{definitionId}/diagram")
    @RequirePerm("approval:process:view")
    public ResponseEntity<byte[]> diagram(@PathVariable String definitionId) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(approvalService.processDefinitionDiagram(definitionId));
    }

    @PutMapping("/{definitionId}/suspend")
    @RequirePerm("approval:process:disable")
    public ApiResult<Void> suspend(@PathVariable String definitionId) {
        approvalService.suspendDefinition(definitionId);
        return ApiResult.ok(null);
    }

    @PutMapping("/{definitionId}/activate")
    @RequirePerm("approval:process:disable")
    public ApiResult<Void> activate(@PathVariable String definitionId) {
        approvalService.activateDefinition(definitionId);
        return ApiResult.ok(null);
    }

    @DeleteMapping("/deployments/{deploymentId}")
    @RequirePerm("approval:process:disable")
    public ApiResult<Void> deleteDeployment(@PathVariable String deploymentId,
                                            @RequestParam(defaultValue = "false") boolean cascade) {
        approvalService.deleteDeployment(deploymentId, cascade);
        return ApiResult.ok(null);
    }

    @PostMapping("/deploy")
    @RequirePerm("approval:process:publish")
    public ApiResult<Void> deploy(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BizException(400, "请选择要部署的流程文件");
        }
        try (InputStream in = file.getInputStream()) {
            approvalService.deployProcess(file.getOriginalFilename(), in);
        } catch (IOException e) {
            throw new BizException(400, "读取上传文件失败");
        }
        return ApiResult.ok(null);
    }
}
