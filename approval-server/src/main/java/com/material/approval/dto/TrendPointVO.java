package com.material.approval.dto;

/** 审批趋势单日数据点（/api/approval/stats/trend），date 格式 yyyy-MM-dd */
public record TrendPointVO(String date, long started, long completed) {
}
