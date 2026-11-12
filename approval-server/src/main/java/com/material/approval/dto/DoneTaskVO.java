package com.material.approval.dto;

import java.time.LocalDateTime;

public record DoneTaskVO(
        String taskId,
        String processInstanceId,
        String processName,
        String title,
        String action,
        String comment,
        LocalDateTime handleTime) {
}
