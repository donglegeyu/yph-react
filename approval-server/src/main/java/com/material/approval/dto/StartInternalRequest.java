package com.material.approval.dto;

import java.util.List;
import java.util.Map;

/**
 * 业务服务内部发起审批请求（/internal/instances，密钥头校验，不走 JWT）
 */
public record StartInternalRequest(
        String businessType,
        Long businessId,
        String businessNo,
        String title,
        Map<String, Object> formData,
        Long applicantId,
        String applicantName,
        Long deptId,
        List<Long> ccUserIds,
        List<String> ccUserNames) {
}
