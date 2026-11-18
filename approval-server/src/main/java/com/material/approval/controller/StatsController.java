package com.material.approval.controller;

import com.material.approval.auth.CurrentUser;
import com.material.approval.auth.RequirePerm;
import com.material.approval.auth.UserContext;
import com.material.approval.common.ApiResult;
import com.material.approval.dto.MyCardsVO;
import com.material.approval.dto.ProcessStatVO;
import com.material.approval.dto.StatsOverviewVO;
import com.material.approval.dto.TrendPointVO;
import com.material.approval.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/approval/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    /** 总览统计（支持公司/周期过滤） */
    @GetMapping("/overview")
    @RequirePerm("approval:stats:view")
    public ApiResult<StatsOverviewVO> overview(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String period) {
        return ApiResult.ok(statsService.overview(companyId, period));
    }

    /** 待办任务页统计卡片：登录即可（当前用户维度，无需统计权限） */
    @GetMapping("/my-cards")
    public ApiResult<MyCardsVO> myCards() {
        CurrentUser user = UserContext.require();
        return ApiResult.ok(statsService.myCards(user));
    }

    /** 按流程统计（支持公司/周期过滤） */
    @GetMapping("/by-process")
    @RequirePerm("approval:stats:view")
    public ApiResult<List<ProcessStatVO>> byProcess(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String period) {
        return ApiResult.ok(statsService.byProcess(companyId, period));
    }

    /** 趋势统计（days 天窗口，支持公司过滤） */
    @GetMapping("/trend")
    @RequirePerm("approval:stats:view")
    public ApiResult<List<TrendPointVO>> trend(
            @RequestParam(defaultValue = "14") int days,
            @RequestParam(required = false) Long companyId) {
        return ApiResult.ok(statsService.trend(days, companyId));
    }
}
