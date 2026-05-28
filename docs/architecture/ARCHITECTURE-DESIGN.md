# 材料申请管理系统 - 可扩展架构设计

> 版本: v1.0 | 日期: 2026-04-07

## 1. 需求总结

| 维度 | 目标 |
|------|------|
| **QPS** | 1000-5000 (可扩展至 10000+) |
| **用户** | 集团公司，多组织/多公司 |
| **多租户** | 完全数据隔离 |
| **实时性** | WebSocket 审批通知 |

---

## 2. 高阶架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                             │
│              Web / PC / Mobile / 小程序                      │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    CDN + API Gateway                        │
│              (认证 / 限流 / 租户路由 / 监控)                 │
└────────────────────────────┬────────────────────────────────┘
                             │
     ┌────────────────────────┼────────────────────────┐
     │                        │                        │
     ▼                        ▼                        ▼
┌─────────────┐      ┌─────────────┐           ┌─────────────┐
│  实时通知   │      │  业务服务    │           │  任务调度   │
│ WebSocket  │      │  (多个)     │           │  XXL-Job   │
└──────┬──────┘      └──────┬──────┘           └─────────────┘
       │                    │
       ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                       消息队列 (Kafka)                       │
│            (事件驱动 / 异步解耦 / 削峰填谷)                   │
└────────────────────────────┬────────────────────────────────┘
                             │
     ┌────────────────────────┼────────────────────────┐
     ▼                        ▼                        ▼
┌─────────────┐      ┌─────────────┐           ┌─────────────┐
│    Redis    │      │    MySQL    │           │Elasticsearch│
│   Cluster   │      │  主从架构    │           │   全文检索  │
└─────────────┘      └─────────────┘           └─────────────┘
```

---

## 3. 多租户架构策略

### 3.1 混合隔离模式

```
┌─────────────────────────────────────────────────────────────┐
│                      租户分层策略                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  标准租户 (90%)  ─── 共享数据库 + tenant_id 隔离            │
│     └── 适合：普通企业用户，成本低                           │
│                                                              │
│  高级租户 (8%)   ─── 独立 Schema + 资源配额                 │
│     └── 适合：中大型企业，数据量大的客户                      │
│                                                              │
│  私有化部署 (2%) ─── 独立数据库 + 独立实例                   │
│     └── 适合：超大型集团，特殊合规要求                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 租户识别流程

```
请求 ──▶ Header: X-Tenant-ID / 域名 / JWT ──▶ TenantContext (线程变量)
                                                    │
                                                    ▼
                                          MyBatis-Plus 拦截器
                                          自动注入 tenant_id 条件
```

### 3.3 数据隔离实现

```java
// 租户上下文
public class TenantContext {
    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();

    public static void setTenantId(Long tenantId) { CURRENT_TENANT.set(tenantId); }
    public static Long getTenantId() { return CURRENT_TENANT.get(); }
    public static void clear() { CURRENT_TENANT.remove(); }
}

// MyBatis-Plus 租户拦截器
@Configuration
public class TenantInterceptor implements MetaObjectHandler {
    @Override
    public void insertFill(MetaObject metaObject) {
        strictInsertFill(metaObject, "tenant_id", Long.class, TenantContext.getTenantId());
    }
}
```

---

## 4. 核心服务模块划分

### 4.1 限界上下文

| 服务 | 职责 | 核心功能 |
|------|------|----------|
| **material-svc** | 材料申请 | 申请单 CRUD、附件管理 |
| **supplier-svc** | 供应商管理 | 档案、资质、评分 |
| **construction-svc** | 施工项管理 | 字典、价格策略 |
| **workflow-svc** | 工作流引擎 | 流程定义、审批任务 |
| **notification-svc** | 通知服务 | WebSocket、站内信 |

### 4.2 动态审批流程设计

#### 4.2.1 审批层级配置模型

```
┌─────────────────────────────────────────────────────────────────┐
│                    动态审批流程配置模型                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  流程模板 (FlowTemplate)                                        │
│  ├── name: "材料采购审批流程"                                    │
│  ├── description: "可配置多级审批"                              │
│  └── levels: [Level_1, Level_2, Level_3, ...]                 │
│                                                                  │
│  审批层级 (ApprovalLevel)                                       │
│  ├── level: 1                                                  │
│  ├── name: "部门主管审批"                                       │
│  ├── assigneeType: ROLE | USER | DEPT_MANAGER | SUPERVISOR    │
│  ├── assigneeValue: "department_manager" (或具体用户ID)        │
│  ├── isOptional: false                                          │
│  └── condition: { budget > 10000 }  (可选的触发条件)           │
│                                                                  │
│  审批规则 (ApprovalRule)                                        │
│  ├── ruleType: AMOUNT_RANGE | DEPARTMENT | MATERIAL_TYPE      │
│  ├── expression: "budget >= 10000 AND budget < 50000"          │
│  └── requiredLevels: [1, 2]                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 动态流程执行示例

```
场景: 预算金额决定审批层级

申请金额: 80,000 元

匹配规则: budget >= 50000 → 需要3级审批

执行流程:
┌────────┐    submit    ┌──────────┐  L1通过  ┌──────────┐  L2通过  ┌──────────┐  L3通过  ┌────────┐
│  草稿  │ ──────────▶ │  部门审批 │ ────────▶ │  经理审批 │ ────────▶ │  总监审批 │ ────────▶ │  完成  │
└────────┘             └──────────┘           └──────────┘           └──────────┘           └────────┘
                              │                       │                       │
                         L1驳回                   L2驳回                   L3驳回
                              │                       │                       │
                              ▼                       ▼                       ▼
                         ┌────────┐             ┌────────┐             ┌────────┐
                         │  草稿  │             │  草稿  │             │  草稿  │
                         │(修改重提)│            │(修改重提)│            │(修改重提)│
                         └────────┘             └────────┘             └────────┘
```

#### 4.2.3 审批人计算策略

```java
// 审批人计算策略
public interface AssigneeStrategy {

    /**
     * 根据审批节点配置计算实际审批人
     */
    List<Long> calculateAssignees(ApprovalLevel level, ApprovalContext context);

    /**
     * 策略类型
     */
    AssigneeType getType();
}

// 内置策略实现
public enum AssigneeType {
    // 1. 指定角色
    ROLE(new RoleAssigneeStrategy()),

    // 2. 指定用户
    USER(new UserAssigneeStrategy()),

    // 3. 部门主管 (申请人的部门负责人)
    DEPT_MANAGER(new DeptManagerAssigneeStrategy()),

    // 4. 超级管理员 (特定金额以上触发)
    SUPERVISOR(new SupervisorAssigneeStrategy()),

    // 5. 上一级审批人的上级
    PARENT_SUPERVISOR(new ParentSupervisorAssigneeStrategy()),

    // 6. 会签 (多人同时审批，全部通过才行)
    COUNTER_SIGN(new CounterSignAssigneeStrategy()),

    // 7. 或签 (多人任一通过即可)
    OR_SIGN(new OrSignAssigneeStrategy());

    // ... 等等
}
```

#### 4.2.4 动态配置表结构

```sql
-- 流程模板表
CREATE TABLE `workflow_template` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `name` varchar(100) NOT NULL COMMENT '流程名称',
  `description` varchar(500) COMMENT '描述',
  `applicable_scene` varchar(50) COMMENT '适用场景: material_purchase / expense / ...',
  `status` tinyint DEFAULT 1 COMMENT '状态:0禁用,1启用',
  `version` int DEFAULT 1 COMMENT '版本号',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_tenant_scene` (`tenant_id`, `applicable_scene`)
) ENGINE=InnoDB;

-- 审批层级配置表
CREATE TABLE `workflow_level` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `template_id` bigint NOT NULL COMMENT '模板ID',
  `level` int NOT NULL COMMENT '层级序号',
  `name` varchar(100) NOT NULL COMMENT '节点名称',
  `assignee_type` varchar(30) NOT NULL COMMENT '审批人类型: ROLE/USER/DEPT_MANAGER/SUPERVISOR',
  `assignee_value` varchar(200) COMMENT '审批人值: 角色CODE或用户ID',
  `is_optional` tinyint DEFAULT 0 COMMENT '是否可选(条件通过才需要)',
  `condition_expr` varchar(500) COMMENT '触发条件表达式',
  `notify_timeout_hours` int DEFAULT 72 COMMENT '超时提醒小时数',
  `auto_pass_hours` int DEFAULT 0 COMMENT '超时自动通过小时数(0表示不自动通过)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_template_id` (`template_id`),
  KEY `idx_level` (`template_id`, `level`)
) ENGINE=InnoDB;

-- 审批规则表 (金额与审批层级映射)
CREATE TABLE `workflow_rule` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` bigint NOT NULL,
  `template_id` bigint NOT NULL COMMENT '关联模板',
  `rule_type` varchar(30) NOT NULL COMMENT '规则类型: AMOUNT_RANGE / DEPT_MATCH',
  `condition_expr` varchar(500) NOT NULL COMMENT '条件表达式',
  `required_level_count` int NOT NULL COMMENT '需要的审批层级数',
  `priority` int DEFAULT 0 COMMENT '优先级(数字越大优先级越高)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_tenant_template` (`tenant_id`, `template_id`)
) ENGINE=InnoDB;

-- 工作流实例表
CREATE TABLE `workflow_instance` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` bigint NOT NULL,
  `template_id` bigint NOT NULL COMMENT '使用的模板ID',
  `business_type` varchar(50) NOT NULL COMMENT '业务类型',
  `business_id` bigint NOT NULL COMMENT '关联业务ID',
  `applicant_id` bigint NOT NULL COMMENT '申请人',
  `current_level` int NOT NULL DEFAULT 0 COMMENT '当前审批层级',
  `total_levels` int NOT NULL COMMENT '总层级数',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/running/completed/rejected',
  `started_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `finished_at` datetime COMMENT '完成时间',
  KEY `idx_tenant_business` (`tenant_id`, `business_type`, `business_id`),
  KEY `idx_applicant` (`tenant_id`, `applicant_id`)
) ENGINE=InnoDB;

-- 审批任务表
CREATE TABLE `workflow_task` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` bigint NOT NULL,
  `instance_id` bigint NOT NULL COMMENT '流程实例ID',
  `level` int NOT NULL COMMENT '审批层级',
  `assignee_id` bigint NOT NULL COMMENT '审批人ID',
  `assignee_type` varchar(20) NOT NULL COMMENT '审批人类型',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/approved/rejected/transferred',
  `comment` text COMMENT '审批意见',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` datetime COMMENT '完成时间',
  KEY `idx_instance_level` (`instance_id`, `level`),
  KEY `idx_assignee_status` (`assignee_id`, `status`)
) ENGINE=InnoDB;
```

#### 4.2.5 高级功能设计

##### 4.2.5.1 超时处理机制

```
┌─────────────────────────────────────────────────────────────────┐
│                    超时处理状态机                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   任务创建                                                       │
│      │                                                          │
│      ▼                                                          │
│   ┌─────────────────┐                                           │
│   │   计时中         │◀────────────────────────────────────┐   │
│   │   (pending)     │                                      │   │
│   └────────┬────────┘                                      │   │
│            │                                               │   │
│     超时时间到?                                         用户审批   │
│     │                       │                              │   │
│     │ yes                   │ no                          │   │
│     ▼                       │                              │   │
│  ┌──────────┐         ┌──────▼────────┐                    │   │
│  │ 挂起      │         │   审批通过    │────────────────────┘   │
│  │(suspended)│         └──────────────┘                        │
│  └────┬─────┘                                                     │
│       │                                                           │
│       │ 用户处理                                                   │
│       ├────────────────────┐                                      │
│       │                    │                                     │
│       ▼                    ▼                                     │
│  ┌──────────┐         ┌──────────┐                               │
│  │ 继续审批  │         │  驳回     │                               │
│  │ (resume) │         │ (reject) │                               │
│  └──────────┘         └──────────┘                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```java
// 超时任务处理
@Component
public class TimeoutTaskHandler {

    @Autowired
    private WorkflowTaskService taskService;
    @Autowired
    private NotificationService notificationService;

    /**
     * 定时扫描超时任务
     * 每分钟执行一次
     */
    @Scheduled(cron = "0 * * * * ?")
    public void scanTimeoutTasks() {
        // 1. 查找即将超时但未超时的任务 → 发送提醒
        List<WorkflowTask> pendingTimeout = taskService.findPendingTimeout();
        for (WorkflowTask task : pendingTimeout) {
            notificationService.sendReminder(task);
        }

        // 2. 查找已超时任务 → 挂起
        List<WorkflowTask> timeoutTasks = taskService.findTimeoutTasks();
        for (WorkflowTask task : timeoutTasks) {
            taskService.suspend(task);
            notificationService.notifySuspension(task);
        }
    }
}

// 提醒通知
public class NotificationService {
    public void sendReminder(WorkflowTask task) {
        // 发送站内信 + 邮件/短信(可选)
        Map<String, Object> data = Map.of(
            "taskId", task.getId(),
            "type", "TIMEOUT_REMINDER",
            "message", String.format("您有一个审批任务即将超时，请尽快处理。任务ID: %d", task.getId())
        );
        webSocketServer.push(task.getAssigneeId(), data);
    }

    public void notifySuspension(WorkflowTask task) {
        // 通知申请人当前任务已挂起
        Map<String, Object> data = Map.of(
            "instanceId", task.getInstanceId(),
            "type", "TASK_SUSPENDED",
            "message", "审批流程因超时已挂起，等待审批人处理。"
        );
        webSocketServer.push(task.getInstance().getApplicantId(), data);
    }
}
```

##### 4.2.5.2 驳回重提策略

```java
// 驳回时用户可选择的重提策略
public enum ReSubmitStrategy {

    /**
     * 从第一级重新开始
     * 适用场景：材料/方案需要大幅修改
     */
    RESTART_FROM_BEGINNING {
        @Override
        public void execute(WorkflowInstance instance) {
            instance.setCurrentLevel(1);
            instance.setStatus("running");
            // 删除后续所有待审批任务
            taskService.deleteFutureTasks(instance.getId());
            // 创建第一级新任务
            createTasksForLevel(instance, 1);
        }
    },

    /**
     * 停留在驳回节点
     * 适用场景：小问题只需在当前节点重新审批
     */
    STAY_AT_REJECTED_LEVEL {
        @Override
        public void execute(WorkflowInstance instance) {
            int rejectedLevel = instance.getCurrentLevel();
            instance.setStatus("running");
            // 标记当前层级的新任务
            taskService.createNewTaskForLevel(instance, rejectedLevel);
        }
    },

    /**
     * 驳回到指定节点
     * 适用场景：复杂流程，可选择驳回到任意层级
     */
    REJECT_TO_SPECIFIC_LEVEL {
        @Override
        public void execute(WorkflowInstance instance, int targetLevel) {
            instance.setCurrentLevel(targetLevel);
            instance.setStatus("running");
            // 删除 targetLevel 之后的所有任务
            taskService.deleteTasksAfterLevel(instance.getId(), targetLevel);
            // 在目标层级创建新任务
            createTasksForLevel(instance, targetLevel);
        }
    };
}

// 驳回操作
public class WorkflowService {

    /**
     * 驳回流程
     */
    public void reject(Long taskId, Long userId, String reason, ReSubmitStrategy strategy) {
        WorkflowTask task = taskService.getById(taskId);
        WorkflowInstance instance = task.getInstance();

        // 1. 更新当前任务状态
        taskService.reject(task, reason);

        // 2. 更新实例状态
        instance.setStatus("rejected");
        instance.setRejectReason(reason);
        instance.setRejectedBy(userId);
        instance.setRejectedAt(LocalDateTime.now());

        // 3. 根据策略处理重提
        strategy.execute(instance);

        // 4. 通知申请人
        notificationService.notifyApplicant(instance, "您的申请已被驳回，请修改后重新提交。");
    }

    /**
     * 重新提交(从驳回状态恢复)
     */
    public void resubmit(Long instanceId, Long userId) {
        WorkflowInstance instance = instanceService.getById(instanceId);

        // 校验：只有申请人才可重提
        if (!instance.getApplicantId().equals(userId)) {
            throw new BizException("只有申请人可以重新提交");
        }

        // 重新计算审批层级(可能规则已更新)
        int requiredLevels = ruleService.calculateRequiredLevel(instance.getTemplate(), instance.getContext());

        // 执行重提策略
        if (instance.getRejectStrategy() == ReSubmitStrategy.RESTART_FROM_BEGINNING) {
            ReSubmitStrategy.RESTART_FROM_BEGINNING.execute(instance);
        } else {
            ReSubmitStrategy.STAY_AT_REJECTED_LEVEL.execute(instance);
        }

        instanceService.update(instance);
    }
}
```

##### 4.2.5.3 加签与转派

```java
// 加签/转派操作
public class WorkflowTaskActionService {

    /**
     * 加签：原审批人不变，新增审批人
     * 场景：需要额外人员知情或参与审批
     */
    public void addApprover(Long taskId, Long currentUserId, Long addUserId, String reason) {
        WorkflowTask originalTask = taskService.getById(taskId);

        // 只有当前审批人才能加签
        if (!originalTask.getAssigneeId().equals(currentUserId)) {
            throw new BizException("只有当前审批人可以加签");
        }

        // 创建加签任务(与原任务同级别)
        WorkflowTask addTask = WorkflowTask.builder()
            .instanceId(originalTask.getInstanceId())
            .level(originalTask.getLevel())
            .assigneeId(addUserId)
            .type("add_sign")  // 区分加签任务
            .parentTaskId(originalTask.getId())  // 关联原任务
            .status("pending")
            .reason(reason)
            .build();
        taskService.create(addTask);

        // 通知加签人
        notificationService.notify(addUserId, "您被添加为审批协作者，请查阅。");
    }

    /**
     * 转派：将审批权转给其他人，原审批人不再参与
     * 场景：审批人休假/离职/出差等
     */
    public void transfer(Long taskId, Long currentUserId, Long targetUserId, String reason) {
        WorkflowTask originalTask = taskService.getById(taskId);

        // 校验权限
        if (!originalTask.getAssigneeId().equals(currentUserId)) {
            throw new BizException("只有当前审批人可以转派");
        }

        // 记录转派历史
        WorkflowTaskTransferLog log = WorkflowTaskTransferLog.builder()
            .taskId(taskId)
            .fromUserId(currentUserId)
            .toUserId(targetUserId)
            .reason(reason)
            .transferredAt(LocalDateTime.now())
            .build();
        taskTransferLogService.save(log);

        // 更新任务审批人
        originalTask.setAssigneeId(targetUserId);
        originalTask.setStatus("pending");  // 重新变为待审批
        originalTask.setTransferCount(originalTask.getTransferCount() + 1);
        taskService.update(originalTask);

        // 通知原审批人(已转派)
        notificationService.notify(currentUserId, String.format("您已将任务转派给 %s", targetUserId));

        // 通知新审批人
        notificationService.notify(targetUserId, "您收到一个转派的审批任务，请及时处理。");
    }

    /**
     * 审批加签/转派任务
     * 加签任务不影响原流程进度，原审批人仍需审批
     * 转派任务直接替换原审批人
     */
    public void approveAddSignTask(Long taskId, Long userId, String comment) {
        WorkflowTask task = taskService.getById(taskId);

        if (!task.getAssigneeId().equals(userId)) {
            throw new BizException("您不是此任务的审批人");
        }

        // 加签任务审批不影响原流程
        taskService.approve(task, comment);

        // 通知申请人(加签人已审批)
        notificationService.notifyApplicant(task.getInstance(),
            String.format("加签人 %s 已审批通过。", userId));
    }
}
```

##### 4.2.5.4 流程图解

```
完整审批流程（含高级功能）

                    ┌─────────────────────────────────────┐
                    │           提交申请                  │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         计算审批层级                  │
                    │    (根据金额/类型等规则动态确定)       │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         Level 1 审批                  │
                    │  [部门主管] ─── 同意 ───┐            │
                    │         │               │            │
                    │         │ 驳回 ───▶ [选择策略]        │
                    │         │         ┌─────┴─────┐      │
                    │         │    从头开始  停留当前        │
                    │         │         └─────────┘      │
                    │         │               │            │
                    │         │    ◀─────────┘            │
                    │         │ (修改后重提)               │
                    └─────────┼───────────────────────────┘
                              │
                         同意  │
                              ▼
                    ┌─────────────────────────────────────┐
                    │      Level 1 + 加签? 转派?           │
                    │                                      │
                    │   加签 ──▶ [A/B 同时审批] ──▶ 继续    │
                    │   转派 ──▶ [C 替代 B] ──▶ 继续       │
                    │                                      │
                    │         超时 ──▶ [挂起+提醒]          │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         Level 2 审批                  │
                    │         (同 Level 1)                 │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         Level N 审批                  │
                    │         (同 Level 1)                 │
                    └─────────────────┬───────────────────┘
                                      │
                                 全部通过
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │           流程完成                   │
                    └─────────────────────────────────────┘
```

---

## 5. WebSocket 实时通知架构

### 5.1 推送流程

```
审批提交 ──▶ Workflow Svc ──▶ Kafka ──▶ Notification Svc ──▶ WebSocket ──▶ 用户终端
                                    (workflow.events)
```

### 5.2 消息类型

| 消息类型 | 说明 |
|----------|------|
| `APPROVE_TASK_ASSIGNED` | 新任务待处理 |
| `APPROVE_TASK_COMPLETED` | 任务已审批 |
| `APPROVE_FLOW_COMPLETED` | 流程已完成 |
| `APPROVE_FLOW_REJECTED` | 流程被驳回 |

### 5.3 核心配置

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");  // 消息代理
        registry.setApplicationDestinationPrefixes("/app"); // 客户端发送前缀
        registry.setUserDestinationPrefix("/user");         // 点对点前缀
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/endpoint").setAllowedOriginPatterns("*").withSockJS();
    }
}
```

---

## 6. 数据库设计

### 6.1 核心表结构

```sql
-- 租户表
CREATE TABLE `tenant` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(100) NOT NULL COMMENT '租户名称',
  `code` varchar(50) NOT NULL UNIQUE COMMENT '租户编码',
  `plan_type` tinyint DEFAULT '1' COMMENT '1标准 2高级 3私有化',
  `db_strategy` tinyint DEFAULT '1' COMMENT '1共享 2独立schema 3独立库',
  `status` tinyint DEFAULT '1',
  `expire_time` datetime,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 材料申请表 (已添加 tenant_id 和组合索引)
CREATE TABLE `material_application` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `application_no` varchar(50) NOT NULL COMMENT '申请单号',
  `title` varchar(200) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `supplier_id` bigint,
  `construction_id` bigint,
  `quantity` decimal(15,4) DEFAULT 0,
  `budget` decimal(15,2),
  `workflow_instance_id` bigint COMMENT '工作流实例ID',
  `creator_id` bigint NOT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint DEFAULT 0,
  UNIQUE KEY `uk_tenant_app_no` (`tenant_id`, `application_no`),
  KEY `idx_tenant_status_time` (`tenant_id`, `status`, `create_time`)
) ENGINE=InnoDB;
```

---

## 7. 三阶段演进路线

### Phase 1: 模块化单体 (0-6个月)

> **目标**: 完善功能，建立多租户基础

| 任务 | 说明 |
|------|------|
| 完善现有模块 | 材料申请、供应商、施工项 |
| 多租户数据隔离 | 拦截器 + tenant_id |
| WebSocket 通知 | Spring WebSocket + STOMP |
| 引入 Redis | 热点数据缓存 |

### Phase 2: 服务拆分 (6-12个月)

> **目标**: 垂直拆分，引入消息队列

| 任务 | 说明 |
|------|------|
| 拆分为微服务 | 按限界上下文独立部署 |
| 引入 Kafka | 事件驱动架构 |
| 读写分离 | MySQL 主从 + Redis |
| 引入 Nacos | 服务注册与配置中心 |

### Phase 3: 高可用架构 (12个月+)

> **目标**: 弹性扩展，支持万级 QPS

| 任务 | 说明 |
|------|------|
| Kubernetes 容器化 | 自动扩缩容 |
| 分库分表 | ShardingSphere |
| 多活部署 | 多地域容灾 |
| 全面监控 | SkyWalking + ELK |

---

## 8. 架构决策记录 (ADR)

### ADR-001: 多租户隔离策略

| 项目 | 决策 |
|------|------|
| **状态** | 已接受 |
| **上下文** | 集团公司需要数据隔离，但中小企业需要低成本方案 |
| **决策** | 采用混合模式：标准租户共享数据库、高级租户独立 Schema、私有化租户独立数据库 |
| **后果** | ✅ 成本可控 ✅ 支持差异化 ✅ 未来可平滑迁移 |

### ADR-002: 实时通知技术选型

| 项目 | 决策 |
|------|------|
| **状态** | 已接受 |
| **上下文** | 审批流程需要实时通知，需支持断线重连 |
| **决策** | WebSocket + STOMP 协议 + Kafka 持久化 |
| **后果** | ✅ 实时性好 ✅ 支持消息持久化 ✅ 浏览器原生支持 |

### ADR-003: 工作流引擎策略

| 项目 | 决策 |
|------|------|
| **状态** | 已接受 |
| **上下文** | 审批流程需要灵活定制，避免过度复杂 |
| **决策** | 轻量级状态机自研，不引入 Activiti/Flowable |
| **后果** | ✅ 定制灵活 ✅ 学习成本低 ✅ 适合简单到中等流程 |

---

## 9. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 多租户数据泄露 | 高 | 严格 SQL 拦截审计、定期渗透测试 |
| WebSocket 连接数上限 | 中 | 集群 + Redis Pub/Sub 广播 |
| Kafka 消息顺序 | 中 | 按租户分区保证顺序 |
| 微服务复杂度 | 高 | 模块化渐进演进，而非一次性拆分解耦 |

---

## 10. 立即可实施的优化

基于当前代码架构，以下优化可立即进行：

| 优化项 | 当前 | 建议 | 收益 |
|--------|------|------|------|
| **连接池** | 默认配置 | HikariCP 核心参数调优 | +20% 吞吐 |
| **索引** | 基础 | 添加 `(tenant_id, status, create_time)` 组合索引 | 查询 -50% |
| **租户字段** | 缺失 | 所有业务表添加 `tenant_id` | 支持多租户 |
| **异步日志** | 同步 | Logback 异步写入 | -30ms 延迟 |

---

## 11. 下一步行动

1. **完善工作流设计** - 审批节点配置、驳回逻辑、抄送机制
2. **引入 Redis 缓存** - 热点数据、会话管理
3. **实现 WebSocket 通知** - 审批状态变更实时推送
4. **重构数据库层** - 添加 tenant_id、组合索引
