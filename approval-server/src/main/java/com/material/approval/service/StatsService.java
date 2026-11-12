package com.material.approval.service;

import com.material.approval.dto.ProcessStatVO;
import com.material.approval.dto.StatsOverviewVO;
import com.material.approval.dto.TrendPointVO;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.TaskService;
import org.flowable.engine.repository.ProcessDefinition;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsService {

    private final TaskService taskService;
    private final RepositoryService repositoryService;
    private final JdbcTemplate jdbcTemplate;

    public StatsService(TaskService taskService, RepositoryService repositoryService, JdbcTemplate jdbcTemplate) {
        this.taskService = taskService;
        this.repositoryService = repositoryService;
        this.jdbcTemplate = jdbcTemplate;
    }

    /** 总览：待办数、各状态实例数、本月发起、平均耗时（小时，已完成实例） */
    public StatsOverviewVO overview() {
        long todoCount = taskService.createTaskQuery().count();

        Map<String, Long> byStatus = new HashMap<>();
        jdbcTemplate.query(
                "select status, count(*) c from appr_business_link group by status",
                rs -> {
                    byStatus.put(rs.getString("status"), rs.getLong("c"));
                });

        Long monthStarted = jdbcTemplate.queryForObject(
                "select count(*) from appr_business_link where create_time >= ?",
                Long.class, Timestamp.valueOf(LocalDate.now().withDayOfMonth(1).atStartOfDay()));

        Double avgMinutes = jdbcTemplate.queryForObject(
                "select avg(timestampdiff(minute, h.START_TIME_, h.END_TIME_)) from ACT_HI_PROCINST h "
                        + "where h.END_TIME_ is not null",
                Double.class);
        Double avgDurationHours = avgMinutes == null ? null : Math.round(avgMinutes / 6.0) / 10.0;

        return new StatsOverviewVO(
                todoCount,
                byStatus.getOrDefault("running", 0L),
                byStatus.getOrDefault("approved", 0L),
                byStatus.getOrDefault("rejected", 0L),
                byStatus.getOrDefault("withdrawn", 0L),
                monthStarted == null ? 0L : monthStarted,
                avgDurationHours);
    }

    /** 按流程定义聚合：各状态数量 + 平均耗时（小时，已完成实例） */
    public List<ProcessStatVO> byProcess() {
        List<ProcessStatVO> rows = jdbcTemplate.query(
                "select l.process_def_key def_key, count(*) total, "
                        + "sum(case when l.status = 'running' then 1 else 0 end) running, "
                        + "sum(case when l.status = 'approved' then 1 else 0 end) approved, "
                        + "sum(case when l.status = 'rejected' then 1 else 0 end) rejected, "
                        + "sum(case when l.status = 'withdrawn' then 1 else 0 end) withdrawn "
                        + "from appr_business_link l group by l.process_def_key order by total desc",
                (rs, i) -> new ProcessStatVO(
                        rs.getString("def_key"), null,
                        rs.getLong("total"), rs.getLong("running"), rs.getLong("approved"),
                        rs.getLong("rejected"), rs.getLong("withdrawn"), null));

        Map<String, Double> avgHours = new HashMap<>();
        jdbcTemplate.query(
                "select l.process_def_key def_key, avg(timestampdiff(minute, h.START_TIME_, h.END_TIME_)) avg_min "
                        + "from appr_business_link l join ACT_HI_PROCINST h on h.PROC_INST_ID_ = l.process_instance_id "
                        + "where h.END_TIME_ is not null group by l.process_def_key",
                rs -> {
                    Double avgMin = rs.getDouble("avg_min");
                    avgHours.put(rs.getString("def_key"), Math.round(avgMin / 6.0) / 10.0);
                });

        List<ProcessStatVO> result = new ArrayList<>(rows.size());
        for (ProcessStatVO row : rows) {
            result.add(new ProcessStatVO(
                    row.defKey(), defName(row.defKey()),
                    row.total(), row.running(), row.approved(), row.rejected(), row.withdrawn(),
                    avgHours.get(row.defKey())));
        }
        return result;
    }

    /** 最近 days 天的发起/完成趋势（缺数补零） */
    public List<TrendPointVO> trend(int days) {
        int safeDays = Math.min(Math.max(days, 1), 90);
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(safeDays - 1L);
        Timestamp fromTs = Timestamp.valueOf(from.atStartOfDay());

        Map<LocalDate, Long> started = new HashMap<>();
        jdbcTemplate.query(
                "select date(create_time) d, count(*) c from appr_business_link "
                        + "where create_time >= ? group by date(create_time)",
                rs -> {
                    started.put(rs.getDate("d").toLocalDate(), rs.getLong("c"));
                },
                fromTs);

        Map<LocalDate, Long> completed = new HashMap<>();
        jdbcTemplate.query(
                "select date(END_TIME_) d, count(*) c from ACT_HI_PROCINST "
                        + "where END_TIME_ >= ? group by date(END_TIME_)",
                rs -> {
                    completed.put(rs.getDate("d").toLocalDate(), rs.getLong("c"));
                },
                fromTs);

        List<TrendPointVO> points = new ArrayList<>(safeDays);
        for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) {
            points.add(new TrendPointVO(
                    d.toString(),
                    started.getOrDefault(d, 0L),
                    completed.getOrDefault(d, 0L)));
        }
        return points;
    }

    private String defName(String defKey) {
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(defKey).latestVersion().singleResult();
        return definition == null ? defKey : definition.getName();
    }
}
