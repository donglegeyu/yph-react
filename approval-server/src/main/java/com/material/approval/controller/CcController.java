package com.material.approval.controller;

import com.material.approval.auth.RequirePerm;
import com.material.approval.auth.UserContext;
import com.material.approval.common.ApiResult;
import com.material.approval.common.PageData;
import com.material.approval.dto.CcVO;
import com.material.approval.service.ApprovalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/approval/cc")
public class CcController {

    private final ApprovalService approvalService;

    public CcController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping("/mine")
    @RequirePerm("approval:done:view")
    public ApiResult<PageData<CcVO>> mine(
            @RequestParam(defaultValue = "1") long current,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String businessNo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer readStatus,
            @RequestParam(required = false) String createTimeFrom,
            @RequestParam(required = false) String createTimeTo) {
        return ApiResult.ok(approvalService.ccMine(UserContext.require(), title, businessNo, status,
                readStatus, createTimeFrom, createTimeTo, current, size));
    }

    @PostMapping("/{id}/read")
    @RequirePerm("approval:done:view")
    public ApiResult<Void> read(@PathVariable Long id) {
        approvalService.ccRead(UserContext.require(), id);
        return ApiResult.ok(null);
    }
}
