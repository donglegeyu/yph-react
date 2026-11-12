package com.material.approval.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.approval.auth.CurrentUser;
import com.material.approval.common.BizException;
import com.material.approval.common.PageData;
import com.material.approval.dto.ActionRequest;
import com.material.approval.dto.CcVO;
import com.material.approval.dto.DoneTaskVO;
import com.material.approval.dto.InstanceDetailVO;
import com.material.approval.dto.InstanceVO;
import com.material.approval.dto.ProcessDefVO;
import com.material.approval.dto.StartRequest;
import com.material.approval.dto.TaskDetailVO;
import com.material.approval.dto.TaskVO;
import com.material.approval.dto.TransferRequest;
import org.flowable.common.engine.impl.identity.Authentication;
import org.flowable.engine.HistoryService;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.history.HistoricProcessInstance;
import org.flowable.engine.repository.Deployment;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.identitylink.api.IdentityLink;
import org.flowable.task.api.Task;
import org.flowable.task.api.TaskQuery;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class ApprovalService {

    public static final String PROCESS_KEY = "materialApplication";

    private final TaskService taskService;
    private final RuntimeService runtimeService;
    private final HistoryService historyService;
    private final RepositoryService repositoryService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public ApprovalService(TaskService taskService, RuntimeService runtimeService, HistoryService historyService,
                           RepositoryService repositoryService, JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.taskService = taskService;
        this.runtimeService = runtimeService;
        this.historyService = historyService;
        this.repositoryService = repositoryService;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    // ---------------- 待办任务 ----------------

    public PageData<TaskVO> todo(CurrentUser user, String keyword, long current, long size) {
        long total = todoQuery(user, keyword).count();
        List<Task> tasks = todoQuery(user, keyword)
                .orderByTaskCreateTime().desc()
                .listPage((int) ((current - 1) * size), (int) size);

        Map<String, LinkRow> links = loadLinks(tasks.stream().map(Task::getProcessInstanceId).toList());
        List<TaskVO> records = new ArrayList<>(tasks.size());
        for (Task task : tasks) {
            LinkRow link = links.get(task.getProcessInstanceId());
            records.add(new TaskVO(
                    task.getId(),
                    task.getName(),
                    task.getProcessInstanceId(),
                    processName(task.getProcessDefinitionId()),
                    link == null ? null : link.title(),
                    link == null ? null : link.applicantName(),
                    toLocal(task.getCreateTime())));
        }
        return new PageData<>(records, total, current, size);
    }

    public TaskDetailVO taskDetail(CurrentUser user, String taskId) {
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task == null) {
            throw new BizException(404, "任务不存在或已处理");
        }
        checkTaskPermission(task, user);
        Map<String, LinkRow> links = loadLinks(List.of(task.getProcessInstanceId()));
        LinkRow link = links.get(task.getProcessInstanceId());

        List<TaskDetailVO.TimelineItem> timeline = jdbcTemplate.query(
                "select task_def_key, action, operator_name, comment, create_time from appr_task_action "
                        + "where process_instance_id = ? order by create_time asc",
                (rs, i) -> new TaskDetailVO.TimelineItem(
                        rs.getString("task_def_key"),
                        rs.getString("action"),
                        rs.getString("operator_name"),
                        rs.getString("comment"),
                        toLocal(rs.getTimestamp("create_time"))),
                task.getProcessInstanceId());

        return new TaskDetailVO(
                task.getId(), task.getName(), task.getProcessInstanceId(),
                processName(task.getProcessDefinitionId()),
                link == null ? null : link.title(),
                link == null ? null : link.businessNo(),
                link == null ? null : link.applicantId(),
                link == null ? null : link.applicantName(),
                link == null ? null : link.status(),
                link == null ? null : link.formData(),
                toLocal(task.getCreateTime()),
                timeline);
    }

    @Transactional
    public void approve(CurrentUser user, String taskId, ActionRequest request) {
        completeTask(user, taskId, true, request, "approve");
    }

    @Transactional
    public void reject(CurrentUser user, String taskId, ActionRequest request) {
        completeTask(user, taskId, false, request, "reject");
    }

    private void completeTask(CurrentUser user, String taskId, boolean approved, ActionRequest request, String action) {
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task == null) {
            throw new BizException(404, "任务不存在或已处理");
        }
        checkTaskPermission(task, user);

        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", approved);
        variables.put("comment", request == null ? null : request.comment());
        variables.put("approverId", user.userId());
        taskService.complete(taskId, variables);

        insertAction(task.getProcessInstanceId(), taskId, task.getTaskDefinitionKey(), action,
                user, request == null ? null : request.comment());

        HistoricProcessInstance instance = historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(task.getProcessInstanceId()).singleResult();
        if (instance != null && instance.getEndTime() != null) {
            jdbcTemplate.update("update appr_business_link set status = ? where process_instance_id = ?",
                    approved ? "approved" : "rejected", task.getProcessInstanceId());
        }
    }

    private void checkTaskPermission(Task task, CurrentUser user) {
        if (user.hasPerm("*")) {
            return;
        }
        if (task.getAssignee() != null && task.getAssignee().equals(String.valueOf(user.userId()))) {
            return;
        }
        if (task.getAssignee() == null) {
            List<IdentityLink> links = taskService.getIdentityLinksForTask(task.getId());
            boolean candidate = links.stream()
                    .filter(l -> "candidate".equals(l.getType()))
                    .anyMatch(l -> (l.getGroupId() != null && user.roles() != null && user.roles().contains(l.getGroupId()))
                            || String.valueOf(user.userId()).equals(l.getUserId()));
            if (candidate) {
                return;
            }
        }
        throw new BizException(403, "无权处理该任务");
    }

    // ---------------- 我发起的 ----------------

    public PageData<InstanceVO> mine(CurrentUser user, String status, long current, long size) {
        StringBuilder where = new StringBuilder(" where applicant_id = ?");
        List<Object> args = new ArrayList<>();
        args.add(user.userId());
        if (StringUtils.hasText(status) && !"all".equalsIgnoreCase(status)) {
            where.append(" and status = ?");
            args.add(status);
        }

        Long total = jdbcTemplate.queryForObject(
                "select count(*) from appr_business_link" + where, Long.class, args.toArray());

        List<Object> listArgs = new ArrayList<>(args);
        listArgs.add((current - 1) * size);
        listArgs.add(size);
        List<Map<String, Object>> rows = jdbcTemplate.query(
                "select process_instance_id, process_def_key, title, business_no, status, create_time from appr_business_link"
                        + where + " order by id desc limit ?, ?",
                (rs, i) -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("process_instance_id", rs.getString("process_instance_id"));
                    row.put("process_def_key", rs.getString("process_def_key"));
                    row.put("title", rs.getString("title"));
                    row.put("business_no", rs.getString("business_no"));
                    row.put("status", rs.getString("status"));
                    row.put("create_time", rs.getTimestamp("create_time"));
                    return row;
                },
                listArgs.toArray());

        List<String> instanceIds = rows.stream().map(r -> (String) r.get("process_instance_id")).toList();
        Map<String, Timestamp> endTimes = loadEndTimes(instanceIds);
        Map<String, String> defNames = loadDefNames(rows.stream()
                .map(r -> (String) r.get("process_def_key")).distinct().toList());

        List<InstanceVO> records = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            String instanceId = (String) row.get("process_instance_id");
            records.add(new InstanceVO(
                    instanceId,
                    defNames.get(row.get("process_def_key")),
                    (String) row.get("title"),
                    (String) row.get("business_no"),
                    (String) row.get("status"),
                    toLocal((Timestamp) row.get("create_time")),
                    toLocal(endTimes.get(instanceId))));
        }
        return new PageData<>(records, total == null ? 0 : total, current, size);
    }

    private Map<String, Timestamp> loadEndTimes(List<String> instanceIds) {
        List<String> ids = instanceIds.stream().filter(StringUtils::hasText).distinct().toList();
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        String placeholders = ids.stream().map(id -> "?").collect(Collectors.joining(","));
        Map<String, Timestamp> result = new HashMap<>();
        jdbcTemplate.query(
                "select PROC_INST_ID_, END_TIME_ from ACT_HI_PROCINST where PROC_INST_ID_ in (" + placeholders + ")",
                rs -> {
                    result.put(rs.getString("PROC_INST_ID_"), rs.getTimestamp("END_TIME_"));
                },
                ids.toArray());
        return result;
    }

    private Map<String, String> loadDefNames(List<String> defKeys) {
        Map<String, String> result = new HashMap<>();
        for (String key : defKeys) {
            if (!StringUtils.hasText(key) || result.containsKey(key)) {
                continue;
            }
            ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                    .processDefinitionKey(key).latestVersion().singleResult();
            result.put(key, definition == null ? key : definition.getName());
        }
        return result;
    }

    // ---------------- 已办任务 ----------------

    public PageData<DoneTaskVO> done(CurrentUser user, long current, long size) {
        Long total = jdbcTemplate.queryForObject(
                "select count(*) from appr_task_action where operator_id = ? and action <> 'urge'", Long.class, user.userId());
        List<Map<String, Object>> rows = jdbcTemplate.query(
                "select process_instance_id, task_id, task_def_key, action, comment, create_time "
                        + "from appr_task_action where operator_id = ? and action <> 'urge' order by create_time desc limit ?, ?",
                (rs, i) -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("process_instance_id", rs.getString("process_instance_id"));
                    row.put("task_id", rs.getString("task_id"));
                    row.put("action", rs.getString("action"));
                    row.put("comment", rs.getString("comment"));
                    row.put("create_time", rs.getTimestamp("create_time"));
                    return row;
                },
                user.userId(), (current - 1) * size, size);

        Map<String, LinkRow> links = loadLinks(rows.stream()
                .map(r -> (String) r.get("process_instance_id")).distinct().toList());
        List<DoneTaskVO> records = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            String instanceId = (String) row.get("process_instance_id");
            LinkRow link = links.get(instanceId);
            HistoricProcessInstance instance = historyService.createHistoricProcessInstanceQuery()
                    .processInstanceId(instanceId).singleResult();
            records.add(new DoneTaskVO(
                    (String) row.get("task_id"),
                    instanceId,
                    instance == null ? null : instance.getProcessDefinitionName(),
                    link == null ? null : link.title(),
                    (String) row.get("action"),
                    (String) row.get("comment"),
                    toLocal((Timestamp) row.get("create_time"))));
        }
        return new PageData<>(records, total == null ? 0 : total, current, size);
    }

    // ---------------- 发起审批 ----------------

    @Transactional
    public Map<String, String> start(CurrentUser user, StartRequest request) {
        if (request == null || !StringUtils.hasText(request.title())) {
            throw new BizException(400, "申请标题不能为空");
        }
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(PROCESS_KEY).latestVersion().singleResult();
        if (definition == null) {
            throw new BizException(500, "流程未部署：" + PROCESS_KEY);
        }

        String businessNo = "MA" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + ThreadLocalRandom.current().nextInt(100, 999);

        Map<String, Object> variables = new HashMap<>();
        variables.put("applicantId", user.userId());
        variables.put("applicantName", user.username());
        variables.put("applicantDeptId", user.deptId());
        variables.put("title", request.title());
        variables.put("reason", request.reason());
        variables.put("amount", request.amount() == null ? BigDecimal.ZERO : request.amount());

        ProcessInstance instance;
        Authentication.setAuthenticatedUserId(String.valueOf(user.userId()));
        try {
            instance = runtimeService.startProcessInstanceByKey(PROCESS_KEY, businessNo, variables);
        } finally {
            Authentication.setAuthenticatedUserId(null);
        }

        Map<String, Object> form = new HashMap<>();
        form.put("title", request.title());
        form.put("reason", request.reason());
        form.put("amount", request.amount());
        String formJson;
        try {
            formJson = objectMapper.writeValueAsString(form);
        } catch (Exception e) {
            throw new BizException(500, "表单序列化失败");
        }

        jdbcTemplate.update(
                "insert into appr_business_link(process_instance_id, process_def_key, business_type, business_id, "
                        + "business_no, title, applicant_id, applicant_name, applicant_dept_id, status, form_key, "
                        + "form_version, form_data) values (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                instance.getId(), PROCESS_KEY, "material_application", 0L, businessNo, request.title(),
                user.userId(), user.username(), user.deptId(), "running", "material_application", 1, formJson);

        if (request.ccUserIds() != null && !request.ccUserIds().isEmpty()) {
            List<String> ccNames = request.ccUserNames() == null ? Collections.emptyList() : request.ccUserNames();
            Timestamp now = new Timestamp(System.currentTimeMillis());
            for (int i = 0; i < request.ccUserIds().size(); i++) {
                Long ccUserId = request.ccUserIds().get(i);
                if (ccUserId == null || ccUserId.equals(user.userId())) {
                    continue;
                }
                String ccUserName = i < ccNames.size() ? ccNames.get(i) : null;
                jdbcTemplate.update(
                        "insert ignore into appr_cc(process_instance_id, business_no, receiver_id, receiver_name, "
                                + "read_status, create_time) values (?,?,?,?,0,?)",
                        instance.getId(), businessNo, ccUserId, ccUserName, now);
            }
        }

        Map<String, String> result = new HashMap<>();
        result.put("instanceId", instance.getId());
        result.put("businessNo", businessNo);
        return result;
    }

    // ---------------- 流程定义 ----------------

    public List<ProcessDefVO> processDefinitions() {
        List<ProcessDefinition> definitions = repositoryService.createProcessDefinitionQuery()
                .latestVersion().orderByProcessDefinitionKey().asc().list();
        List<ProcessDefVO> result = new ArrayList<>(definitions.size());
        for (ProcessDefinition definition : definitions) {
            Deployment deployment = repositoryService.createDeploymentQuery()
                    .deploymentId(definition.getDeploymentId()).singleResult();
            result.add(new ProcessDefVO(
                    definition.getKey(),
                    definition.getName(),
                    definition.getVersion(),
                    definition.getDeploymentId(),
                    deployment == null ? null : toLocal(deployment.getDeploymentTime())));
        }
        return result;
    }

    // ---------------- 内部工具 ----------------

    private LinkRow requireLink(String instanceId) {
        Map<String, LinkRow> links = loadLinks(List.of(instanceId));
        LinkRow link = links.get(instanceId);
        if (link == null) {
            throw new BizException(404, "审批单不存在");
        }
        return link;
    }

    private void insertAction(String instanceId, String taskId, String taskDefKey, String action,
                              CurrentUser operator, String comment) {
        jdbcTemplate.update(
                "insert ignore into appr_task_action(process_instance_id, task_id, task_def_key, action, operator_id, "
                        + "operator_name, comment, create_time) values (?,?,?,?,?,?,?,?)",
                instanceId, taskId, taskDefKey, action, operator.userId(), operator.username(), comment,
                new Timestamp(System.currentTimeMillis()));
    }

    private TaskQuery todoQuery(CurrentUser user, String keyword) {
        TaskQuery query = taskService.createTaskQuery();
        List<String> roles = user.roles() == null ? Collections.emptyList() : user.roles();
        query.or()
                .taskAssignee(String.valueOf(user.userId()))
                .taskCandidateUser(String.valueOf(user.userId()));
        if (!roles.isEmpty()) {
            query.taskCandidateGroupIn(new ArrayList<>(roles));
        }
        query.endOr();
        if (StringUtils.hasText(keyword)) {
            query.taskNameLike("%" + keyword.trim() + "%");
        }
        return query;
    }

    private Map<String, LinkRow> loadLinks(List<String> instanceIds) {
        List<String> ids = instanceIds.stream().filter(StringUtils::hasText).distinct().toList();
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        String placeholders = ids.stream().map(id -> "?").collect(Collectors.joining(","));
        Map<String, LinkRow> result = new HashMap<>();
        jdbcTemplate.query(
                "select process_instance_id, title, business_no, applicant_id, applicant_name, status, form_data "
                        + "from appr_business_link where process_instance_id in (" + placeholders + ")",
                rs -> {
                    String instanceId = rs.getString("process_instance_id");
                    result.put(instanceId, new LinkRow(
                            rs.getString("title"),
                            rs.getString("business_no"),
                            rs.getObject("applicant_id", Long.class),
                            rs.getString("applicant_name"),
                            rs.getString("status"),
                            rs.getString("form_data")));
                },
                ids.toArray());
        return result;
    }

    private String processName(String processDefinitionId) {
        if (!StringUtils.hasText(processDefinitionId)) {
            return null;
        }
        ProcessDefinition definition = repositoryService.getProcessDefinition(processDefinitionId);
        return definition == null ? null : definition.getName();
    }

    private String instanceStatus(HistoricProcessInstance instance) {
        if (instance.getEndTime() == null) {
            return "running";
        }
        return instance.getDeleteReason() == null ? "completed" : "terminated";
    }

    // ---------------- 撤回 / 催办 / 转办 / 加签 ----------------

    @Transactional
    public void withdraw(CurrentUser user, String instanceId, String comment) {
        LinkRow link = requireLink(instanceId);
        boolean admin = user.hasPerm("*");
        if (!admin && (user.userId() == null || !user.userId().equals(link.applicantId()))) {
            throw new BizException(403, "只有申请人可以撤回");
        }
        if (!"running".equals(link.status())) {
            throw new BizException(400, "流程已结束，无法撤回");
        }
        Long acted = jdbcTemplate.queryForObject(
                "select count(*) from appr_task_action where process_instance_id = ? and action in ('approve', 'reject')",
                Long.class, instanceId);
        if (acted != null && acted > 0) {
            throw new BizException(400, "审批人已处理，无法撤回");
        }
        List<Task> activeTasks = taskService.createTaskQuery().processInstanceId(instanceId).list();
        String activeTaskId = activeTasks.isEmpty() ? null : activeTasks.get(0).getId();
        String activeDefKey = activeTasks.isEmpty() ? null : activeTasks.get(0).getTaskDefinitionKey();
        runtimeService.deleteProcessInstance(instanceId, "申请人撤回");
        jdbcTemplate.update("update appr_business_link set status = 'withdrawn' where process_instance_id = ?", instanceId);
        insertAction(instanceId, activeTaskId, activeDefKey, "withdraw", user, comment);
    }

    @Transactional
    public void urge(CurrentUser user, String instanceId, String comment) {
        LinkRow link = requireLink(instanceId);
        boolean admin = user.hasPerm("*");
        if (!admin && (user.userId() == null || !user.userId().equals(link.applicantId()))) {
            throw new BizException(403, "只有申请人可以催办");
        }
        if (!"running".equals(link.status())) {
            throw new BizException(400, "流程已结束，无需催办");
        }
        List<Task> activeTasks = taskService.createTaskQuery().processInstanceId(instanceId).list();
        String activeTaskId = activeTasks.isEmpty() ? null : activeTasks.get(0).getId();
        String activeDefKey = activeTasks.isEmpty() ? null : activeTasks.get(0).getTaskDefinitionKey();
        insertAction(instanceId, activeTaskId, activeDefKey, "urge", user, comment);
    }

    @Transactional
    public void transfer(CurrentUser user, String taskId, TransferRequest request) {
        if (request == null || request.targetId() == null) {
            throw new BizException(400, "请选择转办目标");
        }
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task == null) {
            throw new BizException(404, "任务不存在或已处理");
        }
        checkTaskPermission(task, user);
        if (Objects.equals(request.targetId(), user.userId())) {
            throw new BizException(400, "不能转办给自己");
        }
        taskService.setAssignee(taskId, String.valueOf(request.targetId()));
        String comment = "转办给 " + (StringUtils.hasText(request.targetName()) ? request.targetName() : request.targetId())
                + (StringUtils.hasText(request.comment()) ? "：" + request.comment() : "");
        insertAction(task.getProcessInstanceId(), taskId, task.getTaskDefinitionKey(), "transfer", user, comment);
    }

    @Transactional
    public void addSign(CurrentUser user, String taskId, TransferRequest request) {
        if (request == null || request.targetId() == null) {
            throw new BizException(400, "请选择加签人员");
        }
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task == null) {
            throw new BizException(404, "任务不存在或已处理");
        }
        checkTaskPermission(task, user);
        taskService.addCandidateUser(taskId, String.valueOf(request.targetId()));
        String comment = "加签给 " + (StringUtils.hasText(request.targetName()) ? request.targetName() : request.targetId())
                + (StringUtils.hasText(request.comment()) ? "：" + request.comment() : "");
        insertAction(task.getProcessInstanceId(), taskId, task.getTaskDefinitionKey(), "add_sign", user, comment);
    }

    // ---------------- 实例详情 ----------------

    public InstanceDetailVO instanceDetail(CurrentUser user, String instanceId) {
        LinkRow link = requireLink(instanceId);
        boolean admin = user.hasPerm("*");
        boolean owner = user.userId() != null && user.userId().equals(link.applicantId());
        Long acted = jdbcTemplate.queryForObject(
                "select count(*) from appr_task_action where process_instance_id = ? and operator_id = ?",
                Long.class, instanceId, user.userId());
        Long cced = jdbcTemplate.queryForObject(
                "select count(*) from appr_cc where process_instance_id = ? and receiver_id = ?",
                Long.class, instanceId, user.userId());
        if (!admin && !owner && (acted == null || acted == 0) && (cced == null || cced == 0)) {
            throw new BizException(403, "无权查看该审批单");
        }
        HistoricProcessInstance instance = historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(instanceId).singleResult();
        List<Task> activeTasks = taskService.createTaskQuery().processInstanceId(instanceId).list();
        List<InstanceDetailVO.CurrentNode> currentNodes = activeTasks.stream()
                .map(t -> new InstanceDetailVO.CurrentNode(t.getTaskDefinitionKey(), t.getName(), t.getAssignee()))
                .toList();
        List<TaskDetailVO.TimelineItem> timeline = jdbcTemplate.query(
                "select task_def_key, action, operator_name, comment, create_time from appr_task_action "
                        + "where process_instance_id = ? order by create_time asc",
                (rs, i) -> new TaskDetailVO.TimelineItem(
                        rs.getString("task_def_key"),
                        rs.getString("action"),
                        rs.getString("operator_name"),
                        rs.getString("comment"),
                        toLocal(rs.getTimestamp("create_time"))),
                instanceId);
        return new InstanceDetailVO(
                instanceId,
                instance == null ? null : processName(instance.getProcessDefinitionId()),
                link.title(),
                link.businessNo(),
                link.status(),
                link.formData(),
                instance == null ? null : toLocal(instance.getStartTime()),
                instance == null ? null : toLocal(instance.getEndTime()),
                currentNodes,
                timeline);
    }

    // ---------------- 抄送 ----------------

    public PageData<CcVO> ccMine(CurrentUser user, long current, long size) {
        Long total = jdbcTemplate.queryForObject(
                "select count(*) from appr_cc where receiver_id = ?", Long.class, user.userId());
        List<Map<String, Object>> rows = jdbcTemplate.query(
                "select c.id, c.process_instance_id, c.business_no, c.receiver_name, c.read_status, c.create_time, "
                        + "l.title, l.status as link_status "
                        + "from appr_cc c left join appr_business_link l on l.process_instance_id = c.process_instance_id "
                        + "where c.receiver_id = ? order by c.create_time desc limit ?, ?",
                (rs, i) -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("process_instance_id", rs.getString("process_instance_id"));
                    row.put("business_no", rs.getString("business_no"));
                    row.put("receiver_name", rs.getString("receiver_name"));
                    row.put("read_status", rs.getInt("read_status"));
                    row.put("create_time", rs.getTimestamp("create_time"));
                    row.put("title", rs.getString("title"));
                    row.put("link_status", rs.getString("link_status"));
                    return row;
                },
                user.userId(), (current - 1) * size, size);
        List<CcVO> records = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            records.add(new CcVO(
                    (Long) row.get("id"),
                    (String) row.get("process_instance_id"),
                    (String) row.get("title"),
                    (String) row.get("business_no"),
                    (String) row.get("link_status"),
                    (String) row.get("receiver_name"),
                    (Integer) row.get("read_status"),
                    toLocal((Timestamp) row.get("create_time"))));
        }
        return new PageData<>(records, total == null ? 0 : total, current, size);
    }

    public void ccRead(CurrentUser user, Long id) {
        jdbcTemplate.update(
                "update appr_cc set read_status = 1, read_time = ? where id = ? and receiver_id = ?",
                new Timestamp(System.currentTimeMillis()), id, user.userId());
    }

    private LocalDateTime toLocal(java.util.Date date) {
        if (date == null) {
            return null;
        }
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(date.getTime()), ZoneId.systemDefault());
    }

    private LocalDateTime toLocal(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private record LinkRow(String title, String businessNo, Long applicantId, String applicantName,
                           String status, String formData) {
    }
}
