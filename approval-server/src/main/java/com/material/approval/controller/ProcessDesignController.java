package com.material.approval.controller;

import com.material.approval.auth.RequirePerm;
import com.material.approval.common.ApiResult;
import com.material.approval.dto.ProcessDesignVO;
import com.material.approval.dto.PublishResultVO;
import com.material.approval.dto.SaveDesignRequest;
import com.material.approval.service.ProcessDesignService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 可视化流程设计器：草稿 CRUD + 发布部署 */
@RestController
@RequestMapping("/api/approval/process-designs")
public class ProcessDesignController {

    private final ProcessDesignService processDesignService;

    public ProcessDesignController(ProcessDesignService processDesignService) {
        this.processDesignService = processDesignService;
    }

    @GetMapping
    @RequirePerm("approval:process:view")
    public ApiResult<List<ProcessDesignVO>> list() {
        return ApiResult.ok(processDesignService.list());
    }

    @GetMapping("/{id}")
    @RequirePerm("approval:process:view")
    public ApiResult<ProcessDesignVO> get(@PathVariable Long id) {
        return ApiResult.ok(processDesignService.get(id));
    }

    @PostMapping
    @RequirePerm("approval:process:publish")
    public ApiResult<ProcessDesignVO> create(@RequestBody SaveDesignRequest request) {
        return ApiResult.ok(processDesignService.createDraft(request.name(), request.processKey()));
    }

    @PutMapping("/{id}")
    @RequirePerm("approval:process:publish")
    public ApiResult<ProcessDesignVO> save(@PathVariable Long id, @RequestBody SaveDesignRequest request) {
        return ApiResult.ok(processDesignService.save(id, request));
    }

    @PostMapping("/{id}/publish")
    @RequirePerm("approval:process:publish")
    public ApiResult<PublishResultVO> publish(@PathVariable Long id) {
        return ApiResult.ok(processDesignService.publish(id));
    }
}
