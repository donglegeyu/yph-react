package com.material.approval.dto;

import java.time.LocalDateTime;

public record InstanceVO(
        String instanceId,
        String processName,
        String title,
        String businessNo,
        String status,
        LocalDateTime startTime,
        LocalDateTime endTime) {
}
