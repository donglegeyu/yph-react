package com.material.approval.dto;

import java.time.LocalDateTime;

public record CcVO(
        Long id,
        String instanceId,
        String title,
        String businessNo,
        String status,
        String receiverName,
        Integer readStatus,
        LocalDateTime createTime) {
}
