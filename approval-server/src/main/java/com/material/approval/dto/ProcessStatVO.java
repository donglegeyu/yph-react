package com.material.approval.dto;

/** 按流程定义聚合的审批统计（/api/approval/stats/by-process） */
public record ProcessStatVO(
        String defKey,
        String defName,
        long total,
        long running,
        long approved,
        long rejected,
        long withdrawn,
        Double avgDurationHours) {
}
