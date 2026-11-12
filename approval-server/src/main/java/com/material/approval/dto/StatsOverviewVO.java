package com.material.approval.dto;

/** 审批统计总览（/api/approval/stats/overview） */
public record StatsOverviewVO(
        long todoCount,
        long runningCount,
        long approvedCount,
        long rejectedCount,
        long withdrawnCount,
        long monthStarted,
        Double avgDurationHours) {
}
