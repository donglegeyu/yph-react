package com.material.approval.controller;

import com.material.approval.auth.RequirePerm;
import com.material.approval.common.ApiResult;
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

    @GetMapping("/overview")
    @RequirePerm("approval:stats:view")
    public ApiResult<StatsOverviewVO> overview() {
        return ApiResult.ok(statsService.overview());
    }

    @GetMapping("/by-process")
    @RequirePerm("approval:stats:view")
    public ApiResult<List<ProcessStatVO>> byProcess() {
        return ApiResult.ok(statsService.byProcess());
    }

    @GetMapping("/trend")
    @RequirePerm("approval:stats:view")
    public ApiResult<List<TrendPointVO>> trend(@RequestParam(defaultValue = "14") int days) {
        return ApiResult.ok(statsService.trend(days));
    }
}
