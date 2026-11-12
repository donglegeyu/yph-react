package com.material.approval.dto;

import java.time.LocalDateTime;

public record TaskVO(
        String taskId,
        String taskName,
        String processInstanceId,
        String processName,
        String title,
        String applicantName,
        LocalDateTime createTime) {
}
