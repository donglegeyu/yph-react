package com.material.approval.controller;

import com.material.approval.common.ApiResult;
import com.material.approval.dto.StartInternalRequest;
import com.material.approval.service.ApprovalService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 服务间内部接口（密钥头校验，不在 /api/approval/** 拦截范围内）。
 * 供业务服务（material-system-server）在用户提交业务单据时代为发起/撤回审批。
 */
@RestController
@RequestMapping("/internal")
public class InternalController {

    private static final String KEY_HEADER = "X-Callback-Key";

    private final ApprovalService approvalService;

    @Value("${app.callback.key:internal-callback-key}")
    private String callbackKey;

    public InternalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @PostMapping("/instances")
    public ApiResult<Map<String, String>> start(
            @RequestHeader(value = KEY_HEADER, required = false) String key,
            @RequestBody StartInternalRequest request) {
        checkKey(key);
        return ApiResult.ok(approvalService.startInternal(request));
    }

    @PostMapping("/instances/{instanceId}/withdraw")
    public ApiResult<Void> withdraw(
            @RequestHeader(value = KEY_HEADER, required = false) String key,
            @PathVariable String instanceId,
            @RequestBody(required = false) Map<String, String> body) {
        checkKey(key);
        approvalService.internalWithdraw(instanceId, body == null ? null : body.get("comment"));
        return ApiResult.ok(null);
    }

    private void checkKey(String key) {
        if (callbackKey == null || !callbackKey.equals(key)) {
            throw new com.material.approval.common.BizException(401, "无效的内部接口密钥");
        }
    }
}
