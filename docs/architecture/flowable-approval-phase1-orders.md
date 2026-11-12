# 审批中心第一阶段施工单（P0）

> 状态：待确认后执行；本次未写任何业务实现代码、未提交
> 日期：2026-11-11
> 技术栈（2026-11 方案变更后）：**Spring Boot 3.5.16 + Flowable 7.2.0 + JDK 17 + Jackson 2**；审批库为生产 MySQL 5.7 同实例的独立 schema `material_approval`
> 对应规划：[flowable-approval-center-plan.md](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md)

---

## 0. 执行摘要

| 项目 | 结论 |
|------|------|
| 任务数量 | **12 项**（T0–T11），其中 T0 为 MySQL 5.7 兼容性核验，T1/T2 为权限底座，T3–T11 为审批中心 P0 |
| 工作量量级 | **4–5 周**（1 名后端 + 1 名前端并行；单人全栈约 6–7 周） |
| 技术栈 | **Spring Boot 3.5.16 + Flowable 7.2.0 + JDK 17 + Jackson 2**；显式锁 `mysql-connector-j:8.3.0` 与 `flyway-core:7.15.0`；P0 不引入 springdoc |
| MySQL 结论 | **生产 MySQL 5.7 是目标环境**（需求方锁定，不升级数据库）。审批库用"同实例 + 独立 schema `material_approval`"，不再要求独立 8.0 实例。Boot 3.5.16 默认的驱动 9.7.0 / Flyway 11.7.2 不支持 5.7，必须显式降级。**Flowable 7.2.0 在 5.7 上尚未实测**（本地只有 MySQL 8.0，5.7 镜像无法拉取） |
| 是否阻塞开工 | **不阻塞**。T0 由硬门禁降级为兼容性核验：确认 5.7 下驱动 / 引擎 / Flyway 可用与建库权限，不再决定"是否换 8.0 实例"。若 5.7 实测失败，保留原始报错并升级决策 |
| 技术门禁 | T0（5.7 兼容性核验）→ T1（JWT 与拦截器）→ T3/T4（服务与库）→ T7（API）→ T9/T10（前端）→ T11（联调验收） |
| 上线门禁 | **T1 + T2 全部完成**，且 T0 兼容性核验结论已落地（若 5.7 验证失败需先完成备选方案决策），否则不允许灰度 |

**默认范围**：只做 4 个 P0 子菜单（待我审批、我发起的、已办与抄送、发起审批）+ 材料申请单级审批闭环。流程管理、审批统计、bpmn-js 设计器、动态表单设计器均不在本阶段。

---

## 1. 任务总览（按执行顺序）

| # | 任务 | 依赖 | 主责 | 量级 |
|---|------|------|------|------|
| T0 | MySQL 5.7 兼容性核验（驱动 / 引擎 / Flyway + 建库权限） | 无 | 后端 + DBA/运维 | 0.5 天 |
| T1 | 权限底座后端：JWT 签发 + 拦截器 + 权限注解 | T0 | 后端 | 3–4 天 |
| T2 | 权限底座前端与权限码数据：`perms` 落库、`hasPerm`、按钮守卫 | T1（接口契约） | 前端 + 后端 | 3–4 天 |
| T3 | `approval-server` 模块骨架 | T0 | 后端 | 3–4 天 |
| T4 | 审批库与扩展表初始化 | T3、T0 | 后端 | 1–2 天 |
| T5 | 组织目录客户端 + 审批人解析器（部门负责人） | T3、T4、T1 内部接口 | 后端 | 2–3 天 |
| T6 | 材料申请试点 BPMN 与部署 | T3、T5 | 后端 | 1–2 天 |
| T7 | 审批 P0 后端 API（待办/审批/实例/发起/抄送） | T4、T5、T6 | 后端 | 5–7 天 |
| T8 | 主服务内部组织接口 + 材料申请状态回写接口 | T1 | 后端（主服务） | 2 天 |
| T9 | 菜单迁移脚本 + 前端路由/接口层 | T7 契约、T2 | 前端 + 后端 | 2–3 天 |
| T10 | 前端 4 个 P0 页面与公共组件 | T9 | 前端 | 5–7 天 |
| T11 | 联调、权限验收、灰度 | 全部 | 全员 | 3–4 天 |

**并行建议**：T1/T2 与 T3/T4 可并行（前端权限改造不依赖审批服务）；T8 与 T5/T7 可并行；T10 在 T9 定稿后并行于 T7 的后半段。

---

## 2. 权限底座（P0 前置，阻塞上线）

### 2.1 目标与范围

**目标**：在不动现有版本三件套（Boot 3.2.5 / Jackson 2 / Flyway 7.15）的前提下，让主服务与审批服务使用**同一套 token 与权限码**。

**最小范围**：主服务全量 `/api/**` 鉴权（白名单除外）+ 审批服务 `/api/approval/**` 鉴权。不做 OAuth2、不做 SSO、不做细粒度数据权限执行（`data_scope` 仍只做展示）。

### 2.2 后端最小实现方案（主服务）

| 项 | 方案 |
|----|------|
| Token 形态 | **HS256 JWT**，替换现有 Base64 字符串。Claims：`sub`(userId)、`username`、`deptId`、`roles`(数组)、`perms`(数组)、`iat`、`exp`（8 小时）、`iss=yph` |
| 密钥 | 环境变量 `YPH_JWT_SECRET`，主服务与审批服务共用；禁止写进代码/配置文件明文 |
| 签发 | [AuthServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/AuthServiceImpl.java) 登录成功后签发；登录响应增加 `roles`、`perms`、`expiresAt` |
| 校验 | 新增 `AuthInterceptor`：解析 `Authorization: Bearer <token>`，验签 + 过期校验，写入 `UserContext`（ThreadLocal），请求结束清理 |
| 拦截范围 | `/api/**`，白名单：`/api/auth/login`、`GET /api/nav-menus`（docker-compose 健康检查直连此路径，必须保留）、`/uploads/**`、`/error`、`/v3/api-docs/**`、`/swagger-ui/**`、所有 `OPTIONS` |
| 权限校验 | 新增注解 `@RequirePerm("approval:task:approve")`，拦截器通过 `HandlerMethod` 读取注解并比对 `UserContext.perms`；`ROLE_ADMIN` 放行（与现有菜单逻辑一致） |
| 无注解接口 | 默认只要求"已登录"；审批写接口必须显式加注解 |
| 兼容性 | 旧 token 立即失效，前端会跳登录页；属于一次性强制重新登录，可接受 |

**新增/修改文件（主服务）**：

| 操作 | 路径 |
|------|------|
| 新建 | `material-system-server/src/main/java/com/material/server/annotation/RequirePerm.java` |
| 新建 | `material-system-server/src/main/java/com/material/server/auth/AuthInterceptor.java` |
| 新建 | `material-system-server/src/main/java/com/material/server/auth/UserContext.java` |
| 新建 | `material-system-server/src/main/java/com/material/server/auth/JwtUtils.java` |
| 修改 | `material-system-server/src/main/java/com/material/server/config/WebMvcConfig.java`（注册拦截器与白名单） |
| 修改 | `material-system-server/src/main/java/com/material/server/service/impl/AuthServiceImpl.java`（签发 JWT） |
| 修改 | 登录响应 DTO（`LoginResult` / `AuthController`，增加 roles/perms/expiresAt） |
| 修改 | `material-system-server/pom.xml`（新增 `com.auth0:java-jwt:4.4.0`；**不动 Boot/Flyway/MyBatis-Plus 版本**） |

### 2.3 `nav_menu.perms` 填充规则

**权限码格式**：`{module}:{resource}:{action}`，全小写，多词用下划线，例如 `approval:task:approve`、`approval:task:add_sign`。

**存储位置**：复用 `nav_menu` 的按钮行，不新建权限表：

| 字段 | 按钮行取值 |
|------|-----------|
| `menu_type` | `业务菜单` |
| `menu_category` | **`F`**（权限树按 F 识别按钮） |
| `visible` | `0` |
| `status` | `1` |
| `parent_id` | 所属页面菜单 id |
| `level` | 父级 + 1 |
| `perms` | 权限码 |
| `path` / `component` | `NULL` |

**聚合来源**：登录时按 `sys_user_role → sys_role_menu → nav_menu.perms` 聚合去重；`ROLE_ADMIN` 直接返回 `["*"]`。

**前端必须同步修一个坑**：[app.ts](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/store/app.ts#L411-L436) 构建 `secondMenusMap` 时会把所有 `children` 当菜单渲染，**按钮行（`menuCategory === 'F'`）会漏进三级菜单**。必须过滤 `menuCategory !== 'F'`，否则权限码一落库，侧边栏就会多出"同意/驳回"按钮项。

**P0 权限码清单**（随菜单脚本一起插入）：

| 权限码 | 用途 |
|--------|------|
| `approval:todo:view` | 待我审批页面 |
| `approval:task:approve` | 同意 |
| `approval:task:reject` | 驳回 |
| `approval:task:transfer` | 转办（P1 按钮，可先落码不启用） |
| `approval:instance:view` | 查看审批详情 |
| `approval:instance:start` | 发起审批 |
| `approval:instance:withdraw` | 撤回 |
| `approval:cc:read` | 抄送已读 |
| `approval:form:submit` | 提交表单 |

### 2.4 前端按钮权限与后端共用同一套码

| 项 | 方案 |
|----|------|
| 数据来源 | 登录响应返回 `perms`，写入 `localStorage`（与 token 同生命周期），同时存入 Zustand |
| 工具 | 新增 `usePermission()`：`hasPerm(code)` / `hasAnyPerm(codes)`；`perms` 含 `*` 视为管理员 |
| 组件 | 新增 `<PermissionGuard code="approval:task:approve">`，无权限时不渲染子树 |
| 与后端共用 | 前端传入的字符串与后端 `@RequirePerm` **完全一致**，不另建映射表 |
| 行为 | 无权限按钮不渲染（不是置灰）；页面级无权限由路由守卫重定向到 403/占位页 |
| 刷新策略 | token 过期/权限变更需重新登录；P0 不做实时刷新 |

**新增文件**：

- `react-system/src/hooks/usePermission.ts`
- `react-system/src/components/PermissionGuard.tsx`
- 修改 `react-system/src/pages/common/LoginView.tsx`（保存 roles/perms）
- 修改 `react-system/src/store/app.ts`（过滤 F 行、持久化权限）

### 2.5 工作量与阻塞关系

- 后端 3–4 天 + 前端 3–4 天 + 数据/联调 1 天 ≈ **1.5–2 周**。
- **不阻塞开工**：T3/T4/T6 可与 T1/T2 并行。
- **阻塞 P0 上线**：没有拦截器与权限码，审批接口无法通过安全验收；没有前端守卫，按钮权限形同虚设。

---

## 3. `approval-server` 模块骨架

### 3.1 目录结构

```text
/Users/xiongdongying/ai_project/yph-react/approval-server/
├── pom.xml
├── Dockerfile                                  # P1 部署时补，先不写
├── src/main/java/com/material/approval/
│   ├── ApprovalServerApplication.java
│   ├── auth/
│   │   ├── JwtVerifier.java
│   │   ├── AuthInterceptor.java
│   │   ├── RequirePerm.java
│   │   ├── UserContext.java
│   │   └── CurrentUser.java
│   ├── config/
│   │   ├── WebMvcConfig.java
│   │   ├── JwtProperties.java
│   │   ├── MainServiceProperties.java
│   │   ├── CacheConfig.java
│   │   └── FlowableConfig.java
│   ├── controller/
│   │   ├── TaskController.java
│   │   ├── InstanceController.java
│   │   ├── CcController.java
│   │   ├── ProcessDefinitionController.java
│   │   └── FormController.java
│   ├── service/
│   │   ├── TaskService.java
│   │   ├── InstanceService.java
│   │   ├── CcService.java
│   │   ├── ProcessDefinitionService.java
│   │   ├── OrgDirectoryClient.java
│   │   └── CallbackService.java
│   ├── engine/
│   │   ├── ApprovalResolver.java               # 审批人表达式 Bean
│   │   └── ProcessDeployer.java                # 启动时部署 BPMN
│   ├── repository/                             # 统一用 JdbcTemplate，不引入 ORM
│   │   ├── BusinessLinkRepository.java
│   │   ├── TaskActionRepository.java
│   │   ├── CcRepository.java
│   │   ├── AttachmentRepository.java
│   │   └── CallbackLogRepository.java
│   └── dto/ vo/ enums/
├── src/main/resources/
│   ├── application.yml
│   ├── db/migration/approval/
│   │   └── V1__approval_business_tables.sql
│   ├── processes/
│   │   └── material-application.bpmn20.xml
│   └── forms/
│       └── material-application.json
└── src/test/java/com/material/approval/
```

**说明**：目录结构刻意保持扁平，不引入 DDD 分层与多模块；P0 只有一条试点流程，先用 JdbcTemplate 手写 SQL，避免在 Boot 3.5.16 + Flowable 7.2.0 组合下再引入 ORM 的额外兼容面。

### 3.2 pom 依赖清单

```xml
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>3.5.16</version>
</parent>

<properties>
  <java.version>17</java.version>
  <flowable.version>7.2.0</flowable.version>
  <java-jwt.version>4.4.0</java-jwt.version>
  <!-- 覆盖 Boot 3.5.16 默认的 9.7.0：9.x 不支持 MySQL 5.7 -->
  <mysql.version>8.3.0</mysql.version>
  <!-- 覆盖 Boot 3.5.16 默认的 11.7.2：Flyway 10+ 不支持 MySQL 5.7 -->
  <flyway.version>7.15.0</flyway.version>
  <!-- P0 默认不引入；若引入用 2.8.x（Boot 3.5 适配线），不要用面向 Boot 4 的 3.x -->
  <springdoc.version>2.8.13</springdoc.version>
</properties>

<dependencies>
  spring-boot-starter-web
  spring-boot-starter-validation
  spring-boot-starter-jdbc
  spring-boot-starter-cache
  com.github.ben-manes.caffeine:caffeine            <!-- 版本由 Boot 管理 -->
  org.flowable:flowable-spring-boot-starter-process:${flowable.version}
  com.mysql:mysql-connector-j:${mysql.version}      <!-- 显式锁 8.3.0 -->
  org.flywaydb:flyway-core:${flyway.version}        <!-- 显式锁 7.15.0；不要引入 flyway-mysql -->
  com.auth0:java-jwt:${java-jwt.version}
  <!-- org.springdoc:springdoc-openapi-starter-webmvc-ui:${springdoc.version}  P0 不引入 -->
  org.projectlombok:lombok                           <!-- optional，版本由 Boot 管理 -->
  spring-boot-starter-test (test)
</dependencies>
```

**版本注意事项（实施时逐项验证，不要凭记忆升级）**：

1. **不要 import `flowable-dependencies` BOM**。Spring / Jackson / 驱动由 Boot 3.5.16 的 `spring-boot-starter-parent` 管理，Flowable 只提供自身 `org.flowable:*` 的传递依赖。
2. **Jackson 统一为 Jackson 2**：Boot 3.5.16 托管 2.21.4，Flowable 7.2.0 基线 2.19.2，同属 2.x 大版本，**默认不显式对齐**；若出现序列化差异，再用 `<jackson-bom.version>2.19.2</jackson-bom.version>` 回退并保留失败现场。不存在 Jackson 3，也不需要用 `tools.jackson.databind.ObjectMapper`。
3. **MySQL 5.7 的两个版本必须显式锁死**：`mysql-connector-j:8.3.0`（Boot 默认 9.7.0 不支持 5.7）与 `flyway-core:7.15.0`（Boot 默认 11.7.2 不支持 5.7）。**Flyway 7.15 的 MySQL 支持在 core 内，不要引入 `flyway-mysql`**。
4. **Flyway 自动配置不兼容（已实测）**：Boot 3.5 的 `FlywayAutoConfiguration` 按 Flyway 11 编写，与 7.15 组合启动报 `NoSuchMethodError: FluentConfiguration.placeholderSeparator(String)`。处置：`spring.flyway.enabled=false` 只关闭自动配置，改由 `ManualFlywayConfig` 用 Flyway 7.15 的 Java API 手动执行迁移，历史表仍为 `flyway_schema_history_approval`；**不要因此绕过迁移**。
5. **springdoc**：P0 不引入；若引入必须用 2.8.x（Boot 3.5 适配线），不要沿用规划中的 3.x（那是 Boot 4 线）。
6. 不引入 MyBatis-Plus（统一 JdbcTemplate）、不引入 Flowable REST/UI starter、不引入 Flowable IDM（`flowable.idm.enabled=false`），减少兼容面。

### 3.3 配置项（application.yml 要点）

```yaml
server:
  port: 8082

spring:
  datasource:
    url: ${APPROVAL_DB_URL:jdbc:mysql://localhost:3307/material_approval?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true}
    username: ${APPROVAL_DB_USERNAME:root}
    password: ${APPROVAL_DB_PASSWORD:root123456}
  flyway:
    enabled: false                       # Boot 3.5 自动配置与 Flyway 7.15 不兼容，改由 ManualFlywayConfig 程序化迁移
    locations: classpath:db/migration/approval
    table: flyway_schema_history_approval
    baseline-on-migrate: true
    baseline-version: 0

flowable:
  database-schema-update: true
  async-executor-activate: false        # P0 单实例，先关闭异步执行器
  history-level: full
  check-process-definitions: false      # 由 ProcessDeployer 显式部署
  idm:
    enabled: false

appr:
  jwt:
    secret: ${YPH_JWT_SECRET}
    issuer: yph
  main-service:
    base-url: ${MAIN_SERVICE_URL:http://localhost:8081}
    service-token: ${APPROVAL_SERVICE_TOKEN}
    org-cache-ttl: 5m
  callback:
    max-retry: 3
    timeout-ms: 3000
```

**配置说明**：

1. **数据源指向生产 MySQL 5.7 同实例的独立 schema `material_approval`**；不再要求独立 8.0 实例。生产用 `APPROVAL_DB_URL` 注入，不写死。
2. 本地默认 `localhost:3307` 是 MySQL 8.0 开发容器；Connector 8.3 连 8.0 必须带 `allowPublicKeyRetrieval=true`（5.7 的 `mysql_native_password` 不需要，保留无害）。
3. **Flyway**：已实测 Boot 3.5 的自动配置 + Flyway 7.15 启动报 `NoSuchMethodError: FluentConfiguration.placeholderSeparator(String)`，因此 `spring.flyway.enabled=false`，由 `ManualFlywayConfig` 用 Flyway 7.15 的 Java API 在启动时执行 `migrate()`；`locations` / `table` / `baseline-*` 由同一份配置读取，历史表仍为 `flyway_schema_history_approval`。**只关闭自动配置，不绕过迁移**。
4. **H2 联调**（仅用于引擎功能验证，不能证明 5.7 兼容）：H2 2.x 必须使用 `MODE=LEGACY`，例如 `jdbc:h2:mem:approval;MODE=LEGACY;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1`。
5. `flowable.database-schema-update=true` 由引擎自建 `ACT_*`；业务表 `appr_*` 走 Flyway。

### 3.4 与 `material-system-server` 的通信方式

**结论：读走同步 HTTP + 本地缓存，写走同步 HTTP 回调；不共享库、不共享代码库。**

| 场景 | 方式 | 理由 |
|------|------|------|
| 读组织数据（用户/部门/角色） | `GET /api/internal/org/**`（主服务提供），Caffeine 缓存 5 分钟 | 审批人解析是低频读；缓存可避免每次审批都跨服务；不共享数据源，避免 schema 与迁移链耦合 |
| 业务状态回写（材料申请） | `POST /api/internal/material-applications/{id}/status`，带 `X-Service-Token` + `Idempotency-Key=processInstanceId` | 业务写必须经主服务，保留主服务的校验与未来扩展；审批服务不能直接写主库表 |
| 失败处理 | 写入 `appr_callback_log`，重试 3 次（指数退避），仍失败标记 `failed` 并告警 | 保证最终一致，可人工补偿 |
| 为什么不共享 schema | 审批库与主库虽然同处一个 MySQL 5.7 实例，但必须是独立 schema：两套 Flyway 迁移链（主服务 `db/migration` / 审批 `db/migration/approval`）混在一起会互相污染版本号，且破坏"审批服务可独立部署、独立升级、独立回滚"的服务边界 | — |
| 为什么不共享 Java 库 | 两个服务 Boot 版本不同（3.2.5 vs 3.5.16），共享库会被迫同时绑定两套 Spring/Jackson 版本与升级节奏，得不偿失 | — |

**内部接口安全**：`X-Service-Token` 为预共享密钥（环境变量注入），只允许内网调用；主服务内部接口不暴露到外网 nginx。

---

## 4. 数据库方案

### 4.1 结论

**独立 schema `material_approval`**，Flowable 表 `ACT_*` + 业务表 `appr_*`。**默认与主库同处生产 MySQL 5.7 实例（不同 schema）**；独立 MySQL 8.0 实例只是可选部署形态（5.7 兼容性核验失败时的备选），不是前提。由 `APPROVAL_DB_URL` 决定，不写死。

理由与代价见规划 4.5：备份归档独立、升级互不影响、服务边界清晰；代价是组织数据不能 JOIN，用内部接口 + 缓存解决。迁移由显式锁定的 `flyway-core:7.15.0` 执行（`spring.flyway.enabled=false` + 程序化迁移）。

### 4.2 P0 需要的表

**Flowable 自带表（自动创建，不手写 DDL）**：

| 分类 | 表 |
|------|-----|
| 定义 | `ACT_RE_DEPLOYMENT`、`ACT_RE_PROCDEF`、`ACT_GE_BYTEARRAY` |
| 运行时 | `ACT_RU_EXECUTION`、`ACT_RU_TASK`、`ACT_RU_IDENTITYLINK`、`ACT_RU_VARIABLE`、`ACT_RU_EVENT_SUBSCR`、`ACT_RU_JOB` / `ACT_RU_TIMER_JOB` / `ACT_RU_DEADLETTER_JOB` / `ACT_RU_SUSPENDED_JOB` |
| 历史 | `ACT_HI_PROCINST`、`ACT_HI_ACTINST`、`ACT_HI_TASKINST`、`ACT_HI_VARINST`、`ACT_HI_IDENTITYLINK`、`ACT_HI_COMMENT`、`ACT_HI_ATTACHMENT` |
| 通用 | `ACT_GE_PROPERTY`、`ACT_GE_BYTEARRAY` |

> `ACT_ID_*` 不创建：配置 `flowable.idm.enabled=false`，组织模型全部走外部解析器。

**业务扩展表（P0 必建，Flyway 管理）**：

| 表 | 用途 | 关键字段 |
|----|------|---------|
| `appr_business_link` | 流程实例与业务单据关联，审批侧的唯一索引 | `process_instance_id`(唯一)、`process_def_key`、`business_type`、`business_id`、`business_no`、`title`、`applicant_id`、`applicant_dept_id`、`status`、`form_key`、`form_version`、`form_data`(JSON) |
| `appr_task_action` | 审批动作流水（同意/驳回/撤回/抄送） | `process_instance_id`、`task_id`、`task_def_key`、`action`、`operator_id`、`comment`、`create_time` |
| `appr_cc` | 抄送记录与已读状态 | `process_instance_id`、`receiver_id`、`read_status`、`read_time`，唯一键 `(process_instance_id, receiver_id)` |
| `appr_attachment` | 审批附件 | `process_instance_id`、`task_id`、`file_name`、`file_url`、`file_size`、`uploader_id` |
| `appr_callback_log` | 主服务回写日志与重试 | `process_instance_id`、`target_url`、`payload`、`status`、`retry_count`、`last_error` |
| `appr_sequence` | 审批单号序列 | `biz_type`、`seq_date`、`current_value`，唯一键 `(biz_type, seq_date)` |

P0 **不建**：`appr_form_template`、`appr_process_form`（试点表单用 `resources/forms/material-application.json` 静态 schema，P1 再做版本化表单）。

字段级 DDL 见规划 4.5，直接作为 `V1__approval_business_tables.sql` 的基线；脚本要求幂等（`CREATE TABLE IF NOT EXISTS`）。

### 4.3 数据保留

- `ACT_HI_*` 与 `appr_task_action`、`appr_cc`、`appr_business_link` **永久保留**，P0 不写清理任务。
- 附件随业务单据生命周期，业务单据删除时由主服务回调通知审批服务清理（P1）。
- 归档表按 3 年：P1 增加 `appr_archive_*` 与定时归档任务，P0 只预留字段与索引，不实现。

---

## 5. 前端改动

### 5.1 路由注册

**位置**：[router/index.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/router/index.tsx#L99-L179)，`MainLayout` 的 `children` 内，按现有扁平风格追加 6 条：

| path | 组件文件 | 阶段 |
|------|---------|------|
| `/approval/todo` | `src/pages/approval/TodoList.tsx` | P0 |
| `/approval/mine` | `src/pages/approval/MyInitiated.tsx` | P0 |
| `/approval/done` | `src/pages/approval/DoneAndCc.tsx` | P0 |
| `/approval/start` | `src/pages/approval/StartProcess.tsx` | P0 |
| `/approval/admin/process` | `src/pages/approval/ProcessAdmin.tsx` | P1 |
| `/approval/stats` | `src/pages/approval/Stats.tsx` | P1 |

P1 的两条路由本阶段只注册占位页（复用 `BuildingView` 风格），避免菜单点击 404。

### 5.2 菜单迁移脚本

**位置**：`material-system-server/src/main/resources/db/migration/V32__approval_center_menus.sql`（接当前 V31）。

内容与规划 3.3 一致：一级 `approval-center` + 6 个子菜单（`approval-todo`、`approval-mine`、`approval-done`、`approval-start`、`approval-admin-process`、`approval-stats`）+ `sys_domain_menu`（域 1/2/9）+ `sys_role_menu`（非管理员角色）+ 按钮权限行（`menu_category='F'`、`perms`）。全部使用 `WHERE NOT EXISTS` 幂等写法，禁止 `UPDATE nav_menu SET level/sort`。

> 执行前确认：主服务 Flyway 当前已到 V31；若期间有其他迁移插入，本脚本版本号顺延，不修改已执行脚本。**V32 已核对与现有迁移不冲突，并已在主库执行成功**，后续不得修改该脚本内容。

### 5.3 页面与组件文件清单（只列文件，不写实现）

**新增**：

| 类型 | 文件 |
|------|------|
| 页面 | `react-system/src/pages/approval/TodoList.tsx` |
| 页面 | `react-system/src/pages/approval/MyInitiated.tsx` |
| 页面 | `react-system/src/pages/approval/DoneAndCc.tsx` |
| 页面 | `react-system/src/pages/approval/StartProcess.tsx` |
| 页面 | `react-system/src/pages/approval/ProcessAdmin.tsx`（P1 占位） |
| 页面 | `react-system/src/pages/approval/Stats.tsx`（P1 占位） |
| 组件 | `react-system/src/pages/approval/components/ApprovalDetailDrawer.tsx` |
| 组件 | `react-system/src/pages/approval/components/ApprovalTimeline.tsx`（基于 `CompanyTimeline`） |
| 组件 | `react-system/src/pages/approval/components/ApprovalSteps.tsx`（基于 `CompanySteps`） |
| 组件 | `react-system/src/pages/approval/components/DynamicFormRenderer.tsx`（P0 仅支持 input/textarea/number/select/date） |
| 组件 | `react-system/src/pages/approval/components/ProcessCard.tsx` |
| 接口 | `react-system/src/pages/approval/api.ts` |
| 类型 | `react-system/src/pages/approval/types.ts` |
| Hook | `react-system/src/pages/approval/hooks/useApprovalList.ts` |
| 权限 | `react-system/src/hooks/usePermission.ts` |
| 权限 | `react-system/src/components/PermissionGuard.tsx` |

**修改**：

| 文件 | 改动 |
|------|------|
| `react-system/src/router/index.tsx` | 注册 6 条路由 |
| `react-system/src/constants/api.ts` | 增加 `/api/approval/**` 常量 |
| `react-system/vite.config.ts` | 增加 `/api/approval` → `http://localhost:8082` 代理 |
| `react-system/src/store/app.ts` | `secondMenusMap` 过滤 `menuCategory === 'F'`；持久化 perms |
| `react-system/src/pages/common/LoginView.tsx` | 保存 roles/perms |
| `react-system/src/components/layout/*` | 若不复用 `check-circle` 图标，需同步 5 处 `iconMap`；P0 建议直接复用，避免改动 |

**页面能力边界（P0）**：

- 待我审批：列表 + 详情抽屉 + 同意/驳回 + 审批历史；加签/转办按钮先隐藏（P1）。
- 我发起的：列表 + 详情 + 撤回（仅首节点未处理）。
- 已办与抄送：三个页签，只读；抄送支持标记已读。
- 发起审批：只展示材料申请一张流程卡片 + 动态表单 + 提交；不做流程超市分类。
- 表格统一用 `SmartListTemplate`/`ListPageTemplate`，按钮用 `company-ui` 的 `CompanyButton`，不手写导航/布局。

---

## 6. P0 后端接口契约（施工依据）

> 仅列路径与职责，具体 DTO 在 T7 编码时按此契约落地。

| 方法 | 路径 | 职责 | 权限码 |
|------|------|------|--------|
| GET | `/api/approval/tasks/todo` | 分页查询当前用户待办 | `approval:todo:view` |
| GET | `/api/approval/tasks/{taskId}` | 任务详情（含表单、流程图、历史） | `approval:instance:view` |
| POST | `/api/approval/tasks/{taskId}/approve` | 同意并推进 | `approval:task:approve` |
| POST | `/api/approval/tasks/{taskId}/reject` | 驳回至发起人 | `approval:task:reject` |
| GET | `/api/approval/instances/mine` | 我发起的 | `approval:instance:view` |
| GET | `/api/approval/instances/done` | 我已处理的 | `approval:instance:view` |
| GET | `/api/approval/instances/{id}` | 实例详情 | `approval:instance:view` |
| GET | `/api/approval/instances/{id}/timeline` | 审批历史 | `approval:instance:view` |
| POST | `/api/approval/instances` | 发起流程 | `approval:instance:start` |
| POST | `/api/approval/instances/{id}/withdraw` | 撤回 | `approval:instance:withdraw` |
| GET | `/api/approval/cc/mine` | 抄送我的 | `approval:instance:view` |
| POST | `/api/approval/cc/{id}/read` | 标记已读 | `approval:cc:read` |
| GET | `/api/approval/process-definitions/startable` | 可发起流程列表 | `approval:instance:start` |
| GET | `/api/approval/forms/{formKey}` | 表单 schema | `approval:instance:start` |
| GET | `/api/internal/org/users/{id}` | 主服务：用户 + 部门 | 服务令牌 |
| GET | `/api/internal/org/depts/{id}` | 主服务：部门 + 负责人 | 服务令牌 |
| POST | `/api/internal/material-applications/{id}/status` | 主服务：状态回写 | 服务令牌 + 幂等键 |

---

## 7. 任务明细（目标 / 文件 / 依赖 / 验收）

### T0 MySQL 5.7 兼容性核验（不再是硬门禁）

- **目标**：确认生产 MySQL **5.7** 下"驱动 8.3.0 + Flyway 7.15.0 + Flowable 7.2.0"可用，并确认建库权限；不再决定"是否换 8.0 实例"。
- **动作**：在生产/预发执行 `SELECT VERSION();`；确认可 `CREATE DATABASE material_approval DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`，且审批账号有 `CREATE/ALTER/INDEX/SELECT/INSERT/UPDATE/DELETE` 权限；用真实 5.7 环境（临时容器或预发）跑一次引擎启动 + `V1` 迁移。
- **产物**：`docs/architecture/flowable-approval-center-plan.md` 2.4 追加实测结果（含报错原文，如有）。
- **依赖**：无。
- **验收**：拿到 5.7 具体版本号；建库与授权可行；引擎启动无 `NoSuchMethodError` / SQL 语法错误；`flyway_schema_history_approval` 有 `V1` 记录。若 5.7 上失败，**保留原始报错并升级决策**（备选：为审批单独准备 8.0 实例、或调整引擎版本），不得静默换版本绕过。
- **不阻塞**：不阻塞编码；结论只影响 T4 的建库参数与 T11 的联调环境。**Flowable 7.2.0 在 5.7 上尚未实测**（本地仅 MySQL 8.0，5.7 镜像无法拉取）这一事实必须在结论中保留。

### T1 权限底座后端（主服务）

- **目标**：JWT 签发、校验、`@RequirePerm` 生效。
- **文件**：见 2.2。
- **依赖**：T0（仅部署验证时需要）。
- **验收**：① 无 token 访问 `/api/materials` 返回 401；② 登录返回 JWT 与 perms；③ 带 token 访问通过；④ `@RequirePerm` 无权限返回 403；⑤ `GET /api/nav-menus` 无 token 仍可访问（健康检查不挂）；⑥ 旧 Base64 token 被拒绝。

### T2 权限码数据与前端按钮权限

- **目标**：按钮行落库，前端 `hasPerm` / `<PermissionGuard>` 与后端同码。
- **文件**：`V33__approval_permissions.sql`（或在 V32 内一并插入）、`usePermission.ts`、`PermissionGuard.tsx`、`LoginView.tsx`、`store/app.ts`。
- **依赖**：T1 的登录响应契约。
- **验收**：① 非管理员账号只看到有权限的菜单与按钮；② 直接调接口越权返回 403；③ 侧边栏不出现 `menu_category='F'` 的按钮行；④ 管理员全量可见。

### T3 `approval-server` 骨架

- **目标**：服务可启动、连上审批库（MySQL 5.7 同实例的 `material_approval`）、Flowable 引擎初始化成功、健康检查可用。
- **文件**：3.1 目录结构 + `pom.xml` + `application.yml` + `ApprovalServerApplication.java`。
- **依赖**：T0（数据库可用与兼容性结论）。
- **验收**：`mvn spring-boot:run` 启动成功；`ACT_GE_PROPERTY` 等表自动创建；`GET /actuator/health`（或自定义 `/api/approval/health`）返回 UP；Flyway 历史表 `flyway_schema_history_approval` 存在；`mvn dependency:tree` 输出**实际解析版本**（Boot 3.5.16 / Spring Framework / Jackson 2.21.x / Flowable 7.2.0 / connector 8.3.0 / Flyway 7.15.0），与 3.2 一致，且不存在 `flyway-mysql`。

### T4 审批库与扩展表

- **目标**：`V1__approval_business_tables.sql` 执行成功。
- **文件**：`approval-server/src/main/resources/db/migration/approval/V1__approval_business_tables.sql`。
- **依赖**：T3、T0。
- **验收**：6 张 `appr_*` 表存在；重复启动不报错（幂等）；索引与唯一键齐全。

### T5 组织目录客户端 + 审批人解析器

- **目标**：`ApprovalResolver.deptLeader(...)` 可用，空值抛业务异常。
- **文件**：`service/OrgDirectoryClient.java`、`engine/ApprovalResolver.java`、`config/CacheConfig.java`；主服务侧 `InternalOrgController.java`（T8 同步交付）。
- **依赖**：T3、T4、T8 的组织接口。
- **验收**：① 给定 `applicantDeptId` 能返回 `leader_user_id`；② 缓存 5 分钟内不重复请求主服务；③ 负责人为空时提交被阻断并返回可读错误；④ 主服务不可用时降级为缓存旧值，缓存过期则明确报错。

### T6 试点 BPMN 与部署

- **目标**：材料申请单级审批流程可部署、可启动。
- **文件**：`resources/processes/material-application.bpmn20.xml`、`engine/ProcessDeployer.java`。
- **依赖**：T3、T5。
- **验收**：启动日志显示部署成功；`ACT_RE_PROCDEF` 有 `material_application` 定义；用 REST/单测能启动一个实例并生成待办任务。

### T7 P0 后端 API

- **目标**：第 6 节 13 个审批接口全部可用。
- **文件**：`controller/*`、`service/*`、`repository/*`、`dto/*`。
- **依赖**：T4、T5、T6。
- **验收**：① 发起 → 待办 → 同意 → 我发起的终态 → 已办，全链路通；② 驳回后发起人可看到驳回原因并重新提交；③ 撤回仅首节点未处理时成功；④ 抄送列表与已读状态正确；⑤ 所有接口带 `@RequirePerm`；⑥ 重复提交/重复审批有幂等保护（`processInstanceId` + 状态校验）。

### T8 主服务内部接口与状态回写

- **目标**：组织只读接口 + 材料申请状态回写。
- **文件**：`material-system-server/.../controller/InternalOrgController.java`、`InternalBusinessController.java`、`auth/ServiceTokenFilter.java`（或复用拦截器白名单 + 服务令牌校验）。
- **依赖**：T1。
- **验收**：① 无服务令牌返回 401；② 正确令牌返回用户/部门数据；③ 回写接口幂等（同一 `Idempotency-Key` 重复调用结果一致）；④ 状态只允许 `pending/approved/rejected` 合法迁移；⑤ 外网不可达（仅内网）。

### T9 菜单迁移 + 前端路由/接口层

- **目标**：菜单可见、路由可达、接口可调。
- **文件**：`V32__approval_center_menus.sql`、`router/index.tsx`、`constants/api.ts`、`vite.config.ts`、`pages/approval/api.ts`、`types.ts`。
- **依赖**：T2（权限码）、T7（接口契约）。
- **验收**：① 3 个域都能看到"审批中心"及 6 个子菜单；② 非管理员仅看到授权菜单；③ 6 条路由无 404；④ 接口代理到 8082 正常；⑤ 刷新菜单不重复（幂等）。

### T10 前端 4 个 P0 页面

- **目标**：待办、我发起的、已办与抄送、发起审批可用。
- **文件**：见 5.3。
- **依赖**：T9。
- **验收**：① 列表分页/筛选正常；② 详情抽屉展示表单、审批历史、当前节点；③ 同意/驳回后列表实时刷新；④ 撤回按钮仅合法状态显示；⑤ 抄送标记已读生效；⑥ 无权限按钮不渲染；⑦ 全部使用 company-ui 组件，不手写布局。

### T11 联调、权限验收、灰度

- **目标**：端到端验收，具备灰度条件。
- **依赖**：全部。
- **验收**：① 用真实非管理员账号完成一次完整审批；② 越权接口全部 403；③ 健康检查/监控正常；④ 回写失败可重试并留痕；⑤ 输出灰度与回滚步骤（回滚只停审批服务，不影响主服务）。

---

## 8. 明确不做（本阶段边界）

| 不做项 | 原因 |
|--------|------|
| bpmn-js 流程设计器 | P1；P0 用预置 BPMN |
| 动态表单设计器与表单版本化 | P1；P0 用静态 JSON schema |
| 会签、加签、转办、条件分支 | P1/P2；P0 只做或签与单级审批 |
| 流程管理、审批统计菜单 | P1 |
| 站内通知、催办 | P1 |
| `sys_user.manager_id` 与直属汇报线 | P1 增强，不建字段 |
| 工匠申请、施工申请、采购单据接入 | 阶段 4 |
| Flowable REST/UI/IDM | 不引入，减少兼容面与运维面 |
| 审批写操作接入 AiActionGuard | 明确不纳入，仅保留导航 |

---

## 9. 风险与应对（本阶段）

| 风险 | 触发信号 | 应对 |
|------|---------|------|
| **Flyway 7.15 与 Boot 3.5 自动配置不兼容（已实测）** | 启动报 `NoSuchMethodError: FluentConfiguration.placeholderSeparator(String)` | `spring.flyway.enabled=false` + `ManualFlywayConfig` 用 Flyway 7.15 Java API 手动迁移；历史表 `flyway_schema_history_approval`；CI 增加启动冒烟与迁移校验 |
| **Flowable 7.2.0 在 MySQL 5.7 上尚未实测** | T0 出现 SQL 语法 / 驱动认证 / 建表失败 | 保留原始报错并升级决策；备选为审批单独部署 8.0 实例（可选形态）或调整引擎版本；不得静默换版本 |
| MySQL 驱动被 Boot 默认版本覆盖 | 依赖树解析出 9.7.0，连 5.7 报认证/TLS 错误 | 显式 `<mysql.version>8.3.0</mysql.version>`；T3 用 `dependency:tree` 验收 |
| **EOL 无官方补丁（Boot 3.5 + Flowable 7.x）** | 出现新 CVE 无官方修复版本 | 内部补丁流程（后端负责人）+ 月度依赖 SCA（安全/运维，高危 7 天评估、30 天修复）+ 商业支持评估（架构/采购）+ 运行时缓解（内网、WAF 限制 `/api/approval/**`）+ 升级触发器（架构负责人） |
| 权限改造影响现有 60+ 页面 | 401 大面积出现 | 拦截器白名单 + 分批灰度：先 `/api/approval/**` 与内部接口，再全量 `/api/**` |
| 部门负责人数据仍为空 | 审批人解析失败 | T5 前完成数据补齐；空值阻断并给出可读提示，禁止静默通过 |
| 跨服务回写失败 | 主服务不可用/超时 | 重试 + `appr_callback_log` + 人工补偿；P0 不做分布式事务 |
