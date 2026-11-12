package com.material.approval.dto;

import java.time.LocalDateTime;
import java.util.List;

public record InstanceDetailVO(
        String instanceId,
        String processName,
        String title,
        String businessNo,
        String status,
        String formData,
        LocalDateTime startTime,
        LocalDateTime endTime,
        List<CurrentNode> currentNodes,
        List<TaskDetailVO.TimelineItem> timeline) {

    public record CurrentNode(String nodeKey, String nodeName, String assigneeId) {
    }
}
