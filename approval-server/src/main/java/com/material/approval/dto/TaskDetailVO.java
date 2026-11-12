package com.material.approval.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TaskDetailVO(
        String taskId,
        String taskName,
        String processInstanceId,
        String processName,
        String title,
        String businessNo,
        Long applicantId,
        String applicantName,
        String status,
        String formData,
        LocalDateTime createTime,
        List<TimelineItem> timeline) {

    public record TimelineItem(String taskName, String action, String operatorName, String comment, LocalDateTime time) {
    }
}
