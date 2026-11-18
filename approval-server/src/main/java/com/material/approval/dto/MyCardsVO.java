package com.material.approval.dto;

/** 待办任务页统计卡片（/api/approval/stats/my-cards，登录即可） */
public record MyCardsVO(
        long myTodoCount,
        long approachingOverdueCount,
        long overdueCount,
        long submitFailCount) {
}
