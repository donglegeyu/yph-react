package com.material.approval.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.approval.auth.CurrentUser;
import com.material.approval.client.BusinessCallbackClient;
import com.material.approval.common.BizException;
import com.material.approval.common.PageData;
import com.material.approval.dto.ActionRequest;
import com.material.approval.dto.CcVO;
import com.material.approval.dto.DoneTaskVO;
import com.material.approval.dto.InstanceDetailVO;
import com.material.approval.dto.InstanceVO;
import com.material.approval.dto.DeployResultVO;
import com.material.approval.dto.ProcessDefVO;
import com.material.approval.dto.ProcessTemplateVO;
import com.material.approval.dto.StartInternalRequest;
import com.material.approval.dto.StartRequest;
import com.material.approval.dto.TaskDetailVO;
import com.material.approval.dto.TaskVO;
import com.material.approval.dto.TransferRequest;
import org.flowable.bpmn.model.BpmnModel;
import org.flowable.common.engine.api.FlowableException;
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
import org.flowable.image.impl.DefaultProcessDiagramGenerator;
import org.flowable.task.api.Task;
import org.flowable.task.api.TaskQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class ApprovalService {

    private static final Logger log = LoggerFactory.getLogger(ApprovalService.class);

    public static final String PROCESS_KEY = "materialApplication";

    private final TaskService taskService;
    private final RuntimeService runtimeService;
    private final HistoryService historyService;
    private final RepositoryService repositoryService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final BusinessCallbackClient callbackClient;
    private final BusinessBindingService bindingService;
    private final SubmitFailLogService submitFailLogService;

    public ApprovalService(TaskService taskService, RuntimeService runtimeService, HistoryService historyService,
                           RepositoryService repositoryService, JdbcTemplate jdbcTemplate, ObjectMapper objectMapper,
                           BusinessCallbackClient callbackClient, BusinessBindingService bindingService,
                           SubmitFailLogService submitFailLogService) {
        this.taskService = taskService;
        this.runtimeService = runtimeService;
        this.historyService = historyService;
        this.repositoryService = repositoryService;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.callbackClient = callbackClient;
        this.bindingService = bindingService;
        this.submitFailLogService = submitFailLogService;
    }

    // ---------------- 待办任务 ----------------

    public PageData<TaskVO> todo(CurrentUser user, String keyword, String applicantName, long current, long size) {
        TaskQuery query = todoQuery(user, keyword);
        // 申请人筛选：先查匹配的业务单流程实例，再下推到任务查询，保证 count/分页准确
        if (StringUtils.hasText(applicantName)) {
            List<String> matched = jdbcTemplate.queryForList(
                    "select process_instance_id from appr_business_link where applicant_name like ?",
                    String.class, "%" + applicantName.trim() + "%");
            if (matched.isEmpty()) {
                return new PageData<>(new ArrayList<>(), 0, current, size);
            }
            query.processInstanceIdIn(new HashSet<>(matched));
        }
        long total = query.count();
        List<Task> tasks = query
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
            String status = approved ? "approved" : "rejected";
            jdbcTemplate.update("update appr_business_link set status = ? where process_instance_id = ?",
                    status, task.getProcessInstanceId());
            notifyBusinessFinished(task.getProcessInstanceId(), status, request == null ? null : request.comment(),
                    user.username());
        }
    }

    /**
     * 审批终态（通过/驳回）回调业务服务。回调失败仅记日志，不影响审批事务。
     */
    private void notifyBusinessFinished(String instanceId, String status, String comment, String operatorName) {
        try {
            LinkRow link = requireLink(instanceId);
            callbackClient.onFinished(instanceId, link.businessType(), link.businessId(), link.businessNo(),
                    status, comment, operatorName);
        } catch (Exception e) {
            log.error("查询审批绑定信息失败，跳过业务回调 instanceId={}", instanceId, e);
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

    /**
     * 已办任务分页 + 筛选。
     * processName/title 来自 appr_business_link（JOIN 唯一键 uk_process_instance，不产生行放大），
     * 流程名兜底用 Flowable ACT_RE_PROCDEF；myAction/comment/时间直接作用于 appr_task_action。
     */
    public PageData<DoneTaskVO> done(CurrentUser user, String processName, String title, String myAction,
                                     String comment, String handleTimeFrom, String handleTimeTo,
                                     long current, long size) {
        StringBuilder where = new StringBuilder(
                "from appr_task_action a "
                        + "left join appr_business_link l on l.process_instance_id = a.process_instance_id "
                        + "left join ACT_HI_PROCINST h on h.PROC_INST_ID_ = a.process_instance_id "
                        + "left join ACT_RE_PROCDEF p on p.ID_ = h.PROC_DEF_ID_ "
                        + "where a.operator_id = ? and a.action <> 'urge'");
        List<Object> args = new ArrayList<>();
        args.add(user.userId());
        if (StringUtils.hasText(myAction)) {
            where.append(" and a.action = ?");
            args.add(myAction);
        }
        if (StringUtils.hasText(comment)) {
            where.append(" and a.comment like ?");
            args.add("%" + comment.trim() + "%");
        }
        if (StringUtils.hasText(handleTimeFrom)) {
            where.append(" and a.create_time >= ?");
            args.add(handleTimeFrom.trim() + " 00:00:00");
        }
        if (StringUtils.hasText(handleTimeTo)) {
            where.append(" and a.create_time <= ?");
            args.add(handleTimeTo.trim() + " 23:59:59");
        }
        if (StringUtils.hasText(title)) {
            where.append(" and l.title like ?");
            args.add("%" + title.trim() + "%");
        }
        if (StringUtils.hasText(processName)) {
            where.append(" and (p.NAME_ like ? or l.process_def_key like ?)");
            args.add("%" + processName.trim() + "%");
            args.add("%" + processName.trim() + "%");
        }

        Long total = jdbcTemplate.queryForObject(
                "select count(*) " + where, Long.class, args.toArray());
        List<Map<String, Object>> rows = jdbcTemplate.query(
                "select a.process_instance_id, a.task_id, a.action, a.comment, a.create_time "
                        + where + " order by a.create_time desc limit ?, ?",
                (rs, i) -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("process_instance_id", rs.getString("process_instance_id"));
                    row.put("task_id", rs.getString("task_id"));
                    row.put("action", rs.getString("action"));
                    row.put("comment", rs.getString("comment"));
                    row.put("create_time", rs.getTimestamp("create_time"));
                    return row;
                },
                appendPageArgs(args, current, size));

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

    private Object[] appendPageArgs(List<Object> args, long current, long size) {
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add((current - 1) * size);
        pageArgs.add(size);
        return pageArgs.toArray();
    }

    // ---------------- 发起审批 ----------------

    /**
     * 演示表单发起（发起审批页）：businessType 固定 material_application，business_id=0。
     */
    @Transactional
    public Map<String, String> start(CurrentUser user, StartRequest request) {
        if (request == null || !StringUtils.hasText(request.title())) {
            throw new BizException(400, "申请标题不能为空");
        }
        Map<String, Object> form = new HashMap<>();
        form.put("title", request.title());
        form.put("reason", request.reason());
        form.put("amount", request.amount());
        return doStart(PROCESS_KEY, "material_application", 0L, null,
                request.title(), form, user.userId(), user.username(), user.deptId(),
                request.ccUserIds(), request.ccUserNames());
    }

    /**
     * 业务服务内部发起（服务间调用）：按绑定表（审批绑定管理）显式判定，不再静默回退演示流程。
     * 三态返回：
     * - started：绑定启用且流程已发布未停用，正常走审批（返回 instanceId/processKey）；
     * - passedThrough：optional 模式下未绑定 key / 绑定停用 / 流程未发布或停用，提交即通过；
     * - 抛 BizException：required 模式下上述任一未就绪，文案明确到具体层（绑定/流程）。
     */
    @Transactional
    public Map<String, String> startInternal(StartInternalRequest request) {
        try {
            return doStartInternal(request);
        } catch (BizException e) {
            // 失败留痕：REQUIRES_NEW 独立事务落库，主事务回滚不影响该记录；吞掉落库异常不影响原语义
            try {
                submitFailLogService.recordFail(request, e.getMessage());
            } catch (Exception logEx) {
                log.error("提交失败日志写入失败 businessType={}", request == null ? null : request.businessType(), logEx);
            }
            throw e;
        }
    }

    private Map<String, String> doStartInternal(StartInternalRequest request) {
        if (request == null || !StringUtils.hasText(request.businessType())) {
            throw new BizException(400, "businessType 不能为空");
        }
        if (request.businessId() == null) {
            throw new BizException(400, "businessId 不能为空");
        }
        if (!StringUtils.hasText(request.title())) {
            throw new BizException(400, "申请标题不能为空");
        }
        String businessType = request.businessType();

        BusinessBindingService.BindingRow binding = bindingService.getByType(businessType);
        if (binding == null) {
            // 业务类型未注册绑定：视为该功能未纳入审批管理
            throw new BizException(500, "审批流未配置：业务类型「" + businessType + "」未在业务流程配置中登记，"
                    + "请联系管理员在审批中心的业务流程配置中添加绑定");
        }
        if (!binding.enabled()) {
            return passedThrough(businessType, "业务流程绑定已停用（" + binding.businessName() + "）");
        }
        if (!StringUtils.hasText(binding.processKey())) {
            return passedThrough(businessType, "业务流程绑定未配置流程标识（" + binding.businessName() + "）");
        }

        String processKey = binding.processKey();
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(processKey).latestVersion().singleResult();
        if (definition == null) {
            return optionalOrError(binding, "绑定的流程「" + processKey + "」尚未发布");
        }
        if (definition.isSuspended()) {
            return optionalOrError(binding, "绑定的流程「" + (definition.getName() == null ? processKey : definition.getName())
                    + "」已停用，请先在流程定义中启用");
        }

        Map<String, String> result = doStart(processKey, businessType, request.businessId(), request.businessNo(),
                request.title(), request.formData() == null ? Map.of() : request.formData(),
                request.applicantId(), request.applicantName(), request.deptId(),
                request.ccUserIds(), request.ccUserNames());
        result.put("result", "started");
        return result;
    }

    /** optional 模式的三态兜底：未就绪时返回 passedThrough，required 模式抛明确错误 */
    private Map<String, String> optionalOrError(BusinessBindingService.BindingRow binding, String reason) {
        if ("optional".equals(binding.approvalMode())) {
            return passedThrough(binding.businessType(), reason);
        }
        throw new BizException(500, "发起审批失败：" + reason + "（业务「" + binding.businessName() + "」为必审模式，"
                + "流程就绪前无法提交）");
    }

    /** 免审直通响应：业务方按 approved 直通落终态 */
    private Map<String, String> passedThrough(String businessType, String reason) {
        log.info("审批绑定未就绪，免审直通 businessType={} reason={}", businessType, reason);
        Map<String, String> result = new HashMap<>();
        result.put("result", "passedThrough");
        result.put("reason", reason);
        return result;
    }

    private Map<String, String> doStart(String processKey, String businessType, Long businessId, String businessNo,
                                        String title, Map<String, Object> form, Long applicantId,
                                        String applicantName, Long deptId, List<Long> ccUserIds,
                                        List<String> ccUserNames) {
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(processKey).latestVersion().singleResult();
        if (definition == null) {
            throw new BizException(500, "流程未部署：" + processKey);
        }
        // 兜底校验：流程没有审批节点时会 start→end 秒完结且不产生任何待办/回调，
        // 业务单据将永远卡在审批中，必须在发起前拦截
        BpmnModel model = repositoryService.getBpmnModel(definition.getId());
        boolean hasUserTask = model != null && model.getMainProcess() != null
                && model.getMainProcess().getFlowElements().stream()
                        .anyMatch(el -> el instanceof org.flowable.bpmn.model.UserTask);
        if (!hasUserTask) {
            throw new BizException(400, "流程「" + processKey + "」未配置审批节点（仅发起和结束），"
                    + "无法发起审批，请先在流程设计中添加审批节点并重新发布");
        }

        if (!StringUtils.hasText(businessNo)) {
            businessNo = "MA" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    + ThreadLocalRandom.current().nextInt(100, 999);
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("applicantId", applicantId);
        variables.put("applicantName", applicantName);
        variables.put("applicantDeptId", deptId);
        variables.put("title", title);
        variables.put("amount", BigDecimal.ZERO);

        ProcessInstance instance;
        Authentication.setAuthenticatedUserId(String.valueOf(applicantId));
        try {
            instance = runtimeService.startProcessInstanceByKey(processKey, businessNo, variables);
        } finally {
            Authentication.setAuthenticatedUserId(null);
        }

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
                instance.getId(), processKey, businessType, businessId, businessNo, title,
                applicantId, applicantName, deptId, "running", businessType, 1, formJson);

        if (ccUserIds != null && !ccUserIds.isEmpty()) {
            List<String> ccNames = ccUserNames == null ? Collections.emptyList() : ccUserNames;
            Timestamp now = new Timestamp(System.currentTimeMillis());
            for (int i = 0; i < ccUserIds.size(); i++) {
                Long ccUserId = ccUserIds.get(i);
                if (ccUserId == null || ccUserId.equals(applicantId)) {
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
        result.put("processKey", processKey);
        return result;
    }

    // ---------------- 流程定义 ----------------

    public List<ProcessDefVO> processDefinitions(String name, String suspended,
                                                 String deployTimeFrom, String deployTimeTo) {
        var query = repositoryService.createProcessDefinitionQuery()
                .latestVersion().orderByProcessDefinitionKey().asc();
        if (StringUtils.hasText(name)) {
            query.processDefinitionNameLike("%" + name.trim() + "%");
        }
        if (StringUtils.hasText(suspended)) {
            if (Boolean.parseBoolean(suspended.trim())) {
                query.suspended();
            } else {
                query.active();
            }
        }
        List<ProcessDefinition> definitions = query.list();

        java.time.LocalDate fromDate = parseDate(deployTimeFrom);
        java.time.LocalDate toDate = parseDate(deployTimeTo);
        List<ProcessDefVO> result = new ArrayList<>(definitions.size());
        for (ProcessDefinition definition : definitions) {
            Deployment deployment = repositoryService.createDeploymentQuery()
                    .deploymentId(definition.getDeploymentId()).singleResult();
            java.time.LocalDateTime deployTime =
                    deployment == null ? null : toLocal(deployment.getDeploymentTime());
            if (fromDate != null && (deployTime == null || deployTime.toLocalDate().isBefore(fromDate))) {
                continue;
            }
            if (toDate != null && (deployTime == null || deployTime.toLocalDate().isAfter(toDate))) {
                continue;
            }
            result.add(new ProcessDefVO(
                    definition.getId(),
                    definition.getKey(),
                    definition.getName(),
                    definition.getVersion(),
                    definition.getDeploymentId(),
                    deployTime,
                    definition.isSuspended()));
        }
        return result;
    }

    private java.time.LocalDate parseDate(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return java.time.LocalDate.parse(value.trim(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    public String processDefinitionXml(String definitionId) {
        ProcessDefinition definition = requireDefinition(definitionId);
        try (InputStream in = repositoryService.getResourceAsStream(
                definition.getDeploymentId(), definition.getResourceName())) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new BizException(500, "读取流程 XML 失败");
        }
    }

    public byte[] processDefinitionDiagram(String definitionId) {
        ProcessDefinition definition = requireDefinition(definitionId);
        BpmnModel model = repositoryService.getBpmnModel(definition.getId());
        if (model.getLocationMap().isEmpty()) {
            throw new BizException(400, "流程文件缺少图形信息（DI 节点），无法生成流程图");
        }
        try (InputStream in = new DefaultProcessDiagramGenerator().generateDiagram(
                model, "png", Collections.emptyList(), Collections.emptyList(),
                "SansSerif", "SansSerif", "SansSerif", null, 1.0, true)) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new BizException(500, "生成流程图失败");
        }
    }

    @Transactional
    public void suspendDefinition(String definitionId) {
        ProcessDefinition definition = requireDefinition(definitionId);
        repositoryService.suspendProcessDefinitionById(definition.getId(), false, null);
    }

    @Transactional
    public void activateDefinition(String definitionId) {
        ProcessDefinition definition = requireDefinition(definitionId);
        repositoryService.activateProcessDefinitionById(definition.getId(), false, null);
    }

    @Transactional
    public void deleteDeployment(String deploymentId, boolean cascade) {
        Deployment deployment = repositoryService.createDeploymentQuery()
                .deploymentId(deploymentId).singleResult();
        if (deployment == null) {
            throw new BizException(404, "部署不存在");
        }
        if (!cascade) {
            long running = runtimeService.createProcessInstanceQuery()
                    .deploymentId(deploymentId).count();
            if (running > 0) {
                throw new BizException(409, "该部署下有 " + running + " 个进行中的流程实例，不能直接删除");
            }
        }
        repositoryService.deleteDeployment(deploymentId, cascade);
    }

    @Transactional
    public void deployProcess(String fileName, InputStream inputStream) {
        if (!StringUtils.hasText(fileName) || !(fileName.endsWith(".bpmn")
                || fileName.endsWith(".bpmn20.xml") || fileName.endsWith(".xml"))) {
            throw new BizException(400, "仅支持 .bpmn / .bpmn20.xml / .xml 流程文件");
        }
        try {
            repositoryService.createDeployment()
                    .name(fileName)
                    .addInputStream(fileName, inputStream)
                    .deploy();
        } catch (FlowableException e) {
            throw new BizException(400, "流程文件无效：" + e.getMessage());
        }
    }

    // ---------------- 流程模板 ----------------

    /** 内置流程模板元数据（模板文件位于 classpath: process-templates/{key}.bpmn20.xml） */
    private static final List<ProcessTemplateVO> PROCESS_TEMPLATES = List.of(
            new ProcessTemplateVO("sequential-approval", "串行审批",
                    "逐级审批：两级审批依次处理，全部同意后流程结束"),
            new ProcessTemplateVO("conditional-approval", "条件审批（驳回重提）",
                    "支持驳回：审批不同意时退回申请人修改重提，重提后再次进入审批，直至通过"),
            new ProcessTemplateVO("countersign-approval", "会签审批",
                    "并行会签：多实例会签节点，发起时传入 approverList，全部审批人同意（全票）后流程结束"));

    public List<ProcessTemplateVO> processTemplates() {
        return PROCESS_TEMPLATES;
    }

    @Transactional
    public DeployResultVO deployFromTemplate(String templateKey, String name, String processKey) {
        String templateId = requireTemplate(templateKey);
        if (!StringUtils.hasText(name)) {
            throw new BizException(400, "流程名称不能为空");
        }
        String trimmedName = name.trim();
        String key = StringUtils.hasText(processKey) ? processKey.trim()
                : "proc" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                        + ThreadLocalRandom.current().nextInt(100, 1000);
        if (!key.matches("^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$")) {
            throw new BizException(400, "流程标识无效：需以字母或下划线开头，仅含字母、数字、下划线、中划线，长度不超过 64");
        }

        String xml = loadTemplateXml(templateKey);
        xml = xml.replace(templateId, key);
        xml = xml.replace("name=\"模板中文名\"", "name=\"" + escapeXmlAttribute(trimmedName) + "\"");

        Deployment deployment;
        try {
            deployment = repositoryService.createDeployment()
                    .name(trimmedName)
                    .addInputStream(key + ".bpmn20.xml", new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)))
                    .deploy();
        } catch (FlowableException e) {
            throw new BizException(400, "流程部署失败：" + e.getMessage());
        }
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .deploymentId(deployment.getId()).singleResult();
        if (definition == null) {
            throw new BizException(500, "部署成功但未查询到流程定义");
        }
        return new DeployResultVO(definition.getId(), definition.getKey(), definition.getName(), definition.getVersion());
    }

    /** 模板白名单校验，返回模板对应的流程 process id（同时防路径穿越） */
    private String requireTemplate(String templateKey) {
        return switch (templateKey == null ? "" : templateKey) {
            case "sequential-approval" -> "sequentialApproval";
            case "conditional-approval" -> "conditionalApproval";
            case "countersign-approval" -> "countersignApproval";
            default -> throw new BizException(404, "流程模板不存在：" + templateKey);
        };
    }

    private String loadTemplateXml(String templateKey) {
        try (InputStream in = getClass().getClassLoader()
                .getResourceAsStream("process-templates/" + templateKey + ".bpmn20.xml")) {
            if (in == null) {
                throw new BizException(404, "流程模板文件缺失：" + templateKey);
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new BizException(500, "读取流程模板失败");
        }
    }

    private String escapeXmlAttribute(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private ProcessDefinition requireDefinition(String definitionId) {
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionId(definitionId).singleResult();
        if (definition == null) {
            throw new BizException(404, "流程定义不存在");
        }
        return definition;
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
                instanceId, taskId, taskDefKey, action,
                operator == null ? null : operator.userId(),
                operator == null ? null : operator.username(),
                comment,
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
                "select process_instance_id, title, business_no, applicant_id, applicant_name, status, form_data, "
                        + "business_type, business_id "
                        + "from appr_business_link where process_instance_id in (" + placeholders + ")",
                rs -> {
                    String instanceId = rs.getString("process_instance_id");
                    result.put(instanceId, new LinkRow(
                            rs.getString("title"),
                            rs.getString("business_no"),
                            rs.getObject("applicant_id", Long.class),
                            rs.getString("applicant_name"),
                            rs.getString("status"),
                            rs.getString("form_data"),
                            rs.getString("business_type"),
                            rs.getObject("business_id", Long.class)));
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
        callbackClient.onFinished(instanceId, link.businessType(), link.businessId(), link.businessNo(),
                "withdrawn", comment, user.username());
    }

    /**
     * 业务服务内部撤回（服务间调用，密钥头校验）。绕过申请人校验，但同样要求审批人未处理。
     */
    @Transactional
    public void internalWithdraw(String instanceId, String comment) {
        LinkRow link = requireLink(instanceId);
        if (!"running".equals(link.status())) {
            throw new BizException(400, "流程已结束（" + link.status() + "），无法撤回；请刷新业务单据状态");
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
        runtimeService.deleteProcessInstance(instanceId, "业务单据撤回");
        jdbcTemplate.update("update appr_business_link set status = 'withdrawn' where process_instance_id = ?", instanceId);
        insertAction(instanceId, activeTaskId, activeDefKey, "withdraw", null, comment);
        callbackClient.onFinished(instanceId, link.businessType(), link.businessId(), link.businessNo(),
                "withdrawn", comment, null);
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

    public PageData<CcVO> ccMine(CurrentUser user, String title, String businessNo, String status,
                                 Integer readStatus, String createTimeFrom, String createTimeTo,
                                 long current, long size) {
        StringBuilder where = new StringBuilder(
                "from appr_cc c left join appr_business_link l on l.process_instance_id = c.process_instance_id "
                        + "where c.receiver_id = ?");
        List<Object> args = new ArrayList<>();
        args.add(user.userId());
        if (StringUtils.hasText(title)) {
            where.append(" and l.title like ?");
            args.add("%" + title.trim() + "%");
        }
        if (StringUtils.hasText(businessNo)) {
            where.append(" and c.business_no like ?");
            args.add("%" + businessNo.trim() + "%");
        }
        if (StringUtils.hasText(status)) {
            where.append(" and l.status = ?");
            args.add(status.trim());
        }
        if (readStatus != null) {
            where.append(" and c.read_status = ?");
            args.add(readStatus);
        }
        if (StringUtils.hasText(createTimeFrom)) {
            where.append(" and c.create_time >= ?");
            args.add(createTimeFrom.trim() + " 00:00:00");
        }
        if (StringUtils.hasText(createTimeTo)) {
            where.append(" and c.create_time <= ?");
            args.add(createTimeTo.trim() + " 23:59:59");
        }

        Long total = jdbcTemplate.queryForObject("select count(*) " + where, Long.class, args.toArray());
        List<Map<String, Object>> rows = jdbcTemplate.query(
                "select c.id, c.process_instance_id, c.business_no, c.receiver_name, c.read_status, c.create_time, "
                        + "l.title, l.status as link_status " + where + " order by c.create_time desc limit ?, ?",
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
                appendPageArgs(args, current, size));
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
                           String status, String formData, String businessType, Long businessId) {
    }
}
