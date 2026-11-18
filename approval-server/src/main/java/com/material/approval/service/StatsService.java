package com.material.approval.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.approval.auth.CurrentUser;
import com.material.approval.dto.MyCardsVO;
import com.material.approval.dto.ProcessStatVO;
import com.material.approval.dto.StatsOverviewVO;
import com.material.approval.dto.TrendPointVO;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.TaskService;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.task.api.Task;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsService {

    private final TaskService taskService;
    private final RepositoryService repositoryService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public StatsService(TaskService taskService, RepositoryService repositoryService,
                        JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.taskService = taskService;
        this.repositoryService = repositoryService;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * 公司筛选 → 部门 id 集合：companyId 为公司（部门树顶级节点），
     * 用 ancestors 前缀匹配找出公司下全部部门；companyId 为空返回 null（不过滤）。
     * 跨库查询：审批库与主库在同一 MySQL 实例（material_system_react.sys_dept）。
     */
    private List<Long> deptIdsOfCompany(Long companyId) {
        if (companyId == null) {
            return null;
        }
        String ancestors = jdbcTemplate.queryForObject(
                "select ancestors from material_system_react.sys_dept where id = ? and deleted = 0",
                String.class, companyId);
        String prefix = (ancestors == null || ancestors.isBlank()) ? "" : ancestors + "/";
        return jdbcTemplate.queryForList(
                "select id from material_system_react.sys_dept "
                        + "where deleted = 0 and (id = ? or ancestors like ?)",
                Long.class, companyId, prefix + companyId + "%");
    }

    /** 时间周期过滤 SQL 片段（按 create_time），period 为空返回空串 */
    private String periodSql(String period, List<Object> args) {
        LocalDate today = LocalDate.now();
        LocalDate from = switch (period == null ? "" : period) {
            case "month" -> today.withDayOfMonth(1);
            case "quarter" -> today.withMonth(((today.getMonthValue() - 1) / 3) * 3 + 1).withDayOfMonth(1);
            case "year" -> today.withDayOfYear(1);
            default -> null;
        };
        if (from == null) {
            return "";
        }
        args.add(Timestamp.valueOf(from.atStartOfDay()));
        return " and l.create_time >= ? ";
    }

    /** 总览：待办数、各状态实例数、周期内发起、平均耗时（小时，已完成实例） */
    public StatsOverviewVO overview(Long companyId, String period) {
        long todoCount = taskService.createTaskQuery().count();

        List<Long> deptIds = deptIdsOfCompany(companyId);
        List<Object> statusArgs = new ArrayList<>();
        String deptFilter = "";
        if (deptIds != null) {
            deptFilter = " where applicant_dept_id in (" + placeholders(deptIds.size()) + ") ";
            statusArgs.addAll(deptIds);
        }
        Map<String, Long> byStatus = new HashMap<>();
        jdbcTemplate.query(
                "select status, count(*) c from appr_business_link" + deptFilter + " group by status",
                rs -> {
                    byStatus.put(rs.getString("status"), rs.getLong("c"));
                },
                statusArgs.toArray());

        List<Object> monthArgs = new ArrayList<>(statusArgs);
        String monthSql = periodSql(period, monthArgs);
        Long monthStarted = jdbcTemplate.queryForObject(
                "select count(*) from appr_business_link l where 1=1" + deptFilter.replace("applicant_dept_id", "l.applicant_dept_id")
                        + monthSql,
                Long.class, monthArgs.toArray());

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

    /**
     * 待办任务页统计卡片（当前用户维度）：
     * - 我的待办：与待办列表同口径的未完成任务数；
     * - 即将超时 / 超时预警：按节点配置 timeoutHours（小时）分档，停留 ≥50% 时限且未超 = 即将超时，停留 ≥ 时限 = 超时预警；
     *   未配置时限的节点不参与超时统计；
     * - 提交失败：appr_submit_fail_log 全部 status='failed' 记录数（不限提交日期）。
     */
    public MyCardsVO myCards(CurrentUser user) {
        long myTodoCount = taskService.createTaskQuery()
                .or()
                .taskAssignee(String.valueOf(user.userId()))
                .taskCandidateUser(String.valueOf(user.userId()))
                .endOr()
                .count();

        // 当前用户待办任务的 (taskDefinitionKey → createTime)，按节点时限分档
        List<Task> tasks = taskService.createTaskQuery()
                .or()
                .taskAssignee(String.valueOf(user.userId()))
                .taskCandidateUser(String.valueOf(user.userId()))
                .endOr()
                .list();
        Map<String, Long> timeoutHoursByNode = loadTimeoutHours();
        LocalDateTime now = LocalDateTime.now();
        long approaching = 0;
        long overdue = 0;
        for (Task task : tasks) {
            Long hours = timeoutHoursByNode.get(task.getTaskDefinitionKey());
            if (hours == null || hours <= 0 || task.getCreateTime() == null) {
                continue;
            }
            Duration stayed = Duration.between(
                    task.getCreateTime().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime(), now);
            Duration limit = Duration.ofHours(hours);
            if (stayed.compareTo(limit) >= 0) {
                overdue++;
            } else if (stayed.compareTo(limit.multipliedBy(5).dividedBy(10)) >= 0) {
                approaching++;
            }
        }

        Long failCount = jdbcTemplate.queryForObject(
                "select count(*) from appr_submit_fail_log where status = 'failed'", Long.class);

        return new MyCardsVO(myTodoCount, approaching, overdue, failCount == null ? 0 : failCount);
    }

    /** 从 appr_process_design.design_json 汇总全部审批节点的超时时限（节点 id → 小时数），未配置的不放入 */
    private Map<String, Long> loadTimeoutHours() {
        List<String> designs = jdbcTemplate.queryForList(
                "select design_json from appr_process_design where design_json is not null", String.class);
        Map<String, Long> result = new HashMap<>();
        for (String json : designs) {
            collectTimeoutHours(parseSafely(json), result);
        }
        return result;
    }

    private JsonNode parseSafely(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return null;
        }
    }

    private void collectTimeoutHours(JsonNode doc, Map<String, Long> result) {
        if (doc == null) {
            return;
        }
        JsonNode nodes = doc.get("nodes");
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        for (JsonNode node : nodes) {
            collectNodeTimeout(node, result);
            JsonNode branches = node.get("branches");
            if (branches != null && branches.isArray()) {
                for (JsonNode branch : branches) {
                    JsonNode inner = branch.get("nodes");
                    if (inner != null && inner.isArray()) {
                        for (JsonNode child : inner) {
                            collectNodeTimeout(child, result);
                        }
                    }
                }
            }
        }
    }

    private void collectNodeTimeout(JsonNode node, Map<String, Long> result) {
        if (node == null || !"approve".equals(node.path("type").asText())) {
            return;
        }
        JsonNode hours = node.get("timeoutHours");
        if (hours != null && hours.isNumber() && hours.asDouble() > 0) {
            result.put(node.path("id").asText(), hours.asLong());
        }
    }

    /** 按流程定义聚合：各状态数量 + 平均耗时（小时，已完成实例），支持公司/周期过滤 */
    public List<ProcessStatVO> byProcess(Long companyId, String period) {
        List<Long> deptIds = deptIdsOfCompany(companyId);
        List<Object> args = new ArrayList<>();
        String deptFilter = "";
        if (deptIds != null) {
            deptFilter = " and l.applicant_dept_id in (" + placeholders(deptIds.size()) + ") ";
            args.addAll(deptIds);
        }
        String periodFilter = periodSql(period, args);

        List<ProcessStatVO> rows = jdbcTemplate.query(
                "select l.process_def_key def_key, count(*) total, "
                        + "sum(case when l.status = 'running' then 1 else 0 end) running, "
                        + "sum(case when l.status = 'approved' then 1 else 0 end) approved, "
                        + "sum(case when l.status = 'rejected' then 1 else 0 end) rejected, "
                        + "sum(case when l.status = 'withdrawn' then 1 else 0 end) withdrawn "
                        + "from appr_business_link l where 1=1" + deptFilter + periodFilter
                        + " group by l.process_def_key order by total desc",
                (rs, i) -> new ProcessStatVO(
                        rs.getString("def_key"), null,
                        rs.getLong("total"), rs.getLong("running"), rs.getLong("approved"),
                        rs.getLong("rejected"), rs.getLong("withdrawn"), null),
                args.toArray());

        Map<String, Double> avgHours = new HashMap<>();
        jdbcTemplate.query(
                "select l.process_def_key def_key, avg(timestampdiff(minute, h.START_TIME_, h.END_TIME_)) avg_min "
                        + "from appr_business_link l join ACT_HI_PROCINST h on h.PROC_INST_ID_ = l.process_instance_id "
                        + "where h.END_TIME_ is not null" + deptFilter + periodFilter
                        + " group by l.process_def_key",
                rs -> {
                    Double avgMin = rs.getDouble("avg_min");
                    avgHours.put(rs.getString("def_key"), Math.round(avgMin / 6.0) / 10.0);
                },
                args.toArray());

        List<ProcessStatVO> result = new ArrayList<>(rows.size());
        for (ProcessStatVO row : rows) {
            result.add(new ProcessStatVO(
                    row.defKey(), defName(row.defKey()),
                    row.total(), row.running(), row.approved(), row.rejected(), row.withdrawn(),
                    avgHours.get(row.defKey())));
        }
        return result;
    }

    /** 最近 days 天的发起/完成趋势（缺数补零），支持公司过滤（周期由 days 决定，忽略 period） */
    public List<TrendPointVO> trend(int days, Long companyId) {
        int safeDays = Math.min(Math.max(days, 1), 90);
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(safeDays - 1L);
        Timestamp fromTs = Timestamp.valueOf(from.atStartOfDay());

        List<Long> deptIds = deptIdsOfCompany(companyId);
        List<Object> args = new ArrayList<>();
        String deptFilter = "";
        if (deptIds != null) {
            deptFilter = " and applicant_dept_id in (" + placeholders(deptIds.size()) + ") ";
            args.addAll(deptIds);
        }

        Map<LocalDate, Long> started = new HashMap<>();
        jdbcTemplate.query(
                "select date(create_time) d, count(*) c from appr_business_link "
                        + "where create_time >= ?" + deptFilter + " group by date(create_time)",
                rs -> {
                    started.put(rs.getDate("d").toLocalDate(), rs.getLong("c"));
                },
                prepend(fromTs, args));

        Map<LocalDate, Long> completed = new HashMap<>();
        jdbcTemplate.query(
                "select date(h.END_TIME_) d, count(*) c from ACT_HI_PROCINST h "
                        + "join appr_business_link l on l.process_instance_id = h.PROC_INST_ID_ "
                        + "where h.END_TIME_ >= ?" + deptFilter.replace("applicant_dept_id", "l.applicant_dept_id")
                        + " group by date(h.END_TIME_)",
                rs -> {
                    completed.put(rs.getDate("d").toLocalDate(), rs.getLong("c"));
                },
                prepend(fromTs, args));

        List<TrendPointVO> points = new ArrayList<>(safeDays);
        for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) {
            points.add(new TrendPointVO(
                    d.toString(),
                    started.getOrDefault(d, 0L),
                    completed.getOrDefault(d, 0L)));
        }
        return points;
    }

    private Object[] prepend(Object first, List<Object> rest) {
        List<Object> all = new ArrayList<>(rest.size() + 1);
        all.add(first);
        all.addAll(rest);
        return all.toArray();
    }

    private String placeholders(int n) {
        return String.join(",", java.util.Collections.nCopies(n, "?"));
    }

    private String defName(String defKey) {
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(defKey).latestVersion().singleResult();
        return definition == null ? defKey : definition.getName();
    }
}
