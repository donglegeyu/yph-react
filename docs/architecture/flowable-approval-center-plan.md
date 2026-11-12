# 接入 Flowable 审批引擎 + 审批中心一级菜单 规划方案

> 状态：规划稿（本次未修改任何代码、未提交）
> 日期：2026-11-11
> 技术栈（2026-11 方案变更后）：**Spring Boot 3.5.16 + Flowable 7.2.0 + JDK 17 + Jackson 2**；数据库为生产 MySQL 5.7 同实例 + 独立 schema
> 范围：`react-system`（前端）+ `material-system-server`（后端）+ 新增审批服务模块

---

## 0. 执行摘要

| 项目 | 结论 |
|------|------|
| 子菜单数量 | **6 个**（4 个 P0 + 2 个 P1），覆盖待办、我发起、已办/抄送、发起入口、流程管理、统计 |
| Flowable 版本（已锁定） | **Flowable 7.2.0 + Spring Boot 3.5.16 + JDK 17 + Jackson 2**；新建独立模块 `approval-server`，现有 `material-system-server` 保持 Boot 3.2.5 / Jackson 2 / Flyway 7.15 **不动**；已明确接受 Boot 3.5 与 Flowable 7.x 的 OSS EOL 状态（补偿措施与责任人见第 6 节） |
| 试点单据（已锁定） | **材料申请 `material_application`**：无审批后写副作用、无金额计算、单级审批 |
| 最大风险 | **身份与权限底座缺失**：后端没有任何鉴权拦截器，token 只是 Base64 字符串（[AuthServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/AuthServiceImpl.java#L54-L56)），`nav_menu.perms` 全库为 NULL。已作为 **P0 前置项**纳入路线图（见第 5 节阶段 0），不阻塞开工，但阻塞 P0 上线 |
| 第二大风险 | **组织架构没有"直属主管"数据**：`sys_user` 无 manager 字段，`sys_dept.leader_user_id` 7 个部门全为 NULL（已查库）。已决策：P0 用部门负责人 `leader_user_id` 推导，先补数据；`sys_user.manager_id` 作为后续增强 |
| 最大新增风险（EOL） | **无官方补丁运行**：Spring Boot 3.5 的 OSS 支持已于 2026-06 结束，Flowable 7.x 无维护分支。需求方已接受该状态，补偿措施与责任人见第 6 节；接受边界是"内网 + 最小暴露面 + 月度巡检" |
| MySQL 版本结论 | **生产 MySQL 5.7 是目标环境**（需求方锁定，不升级数据库）。审批库使用**生产同实例 + 独立 schema `material_approval`**；必须显式锁 `mysql-connector-j:8.3.0` 与 `flyway-core:7.15.0`（Boot 3.5.16 默认的 9.7.0 / 11.7.2 均不支持 5.7）。**未验证事实：Flowable 7.2.0 尚未在 MySQL 5.7 上实测（本地仅有 MySQL 8.0，5.7 镜像无法拉取）**，T0 由硬门禁降级为兼容性核验 |
| 推荐接入方式 | 嵌入式 Java API（Flowable 7.2.0 + Boot 3.5.16 + JDK 17；独立服务 + 独立 schema + 独立数据源）；不走 Flowable REST 外部服务 |
| 设计器 | `bpmn-js` 自建（前端本地依赖），不用 Flowable 云端账号 |
| 与 AI 助手 | 审批**写操作**（同意/驳回/加签）**不纳入** AiActionGuard；只放行 `navigate` 到待办/详情，保持现状 |

---

## 1. 第一步：只读核查结论

### 1.1 前端菜单怎么来的

**结论：菜单来自数据库 `nav_menu` 表，前端在运行时拉取并组装，不写死、不是常量文件。**

| 事实 | 证据 |
|------|------|
| 菜单表 `nav_menu`，实体字段含 `key/label/path/component/perms/visible/menuCategory/icon/sort/status/parentId/level/menuType/children` | [NavMenu.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/entity/NavMenu.java#L9-L50) |
| 前端启动时 `fetchMenus()` 请求 `GET /api/nav-menus?domainId=&userId=` | [app.ts](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/store/app.ts#L309-L358) |
| 一级菜单分三类：`系统菜单-上`（首页/收藏）、业务菜单（`parentId` 为 null/0）、`系统菜单-下`（底部） | [app.ts](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/store/app.ts#L374-L409) |
| 二级菜单取 `children`，按 `sort` 升序；三级菜单取 `child.children`，前端硬编码最多三级 | [app.ts](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/store/app.ts#L411-L436) |
| 一级栏固定展示前 6 个业务菜单，其余进"更多"抽屉 | [FirstSidebar.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/FirstSidebar.tsx#L103-L129) |
| 二级栏从 `secondMenusMap[activeFirstMenu]` 读取，支持分组展开 | [SecondSidebar.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/SecondSidebar.tsx#L83-L115) |
| 菜单管理页可维护 `菜单类型`（业务菜单 / 系统菜单-上 / 系统菜单-下）、父级、排序、图标、状态 | [MenuManagement.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/MenuManagement.tsx#L238-L250)、[MenuManagement.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/MenuManagement.tsx#L116-L117) |
| `level` 由后端按父级自动计算（父 0 → 子 1 → 孙 2） | [NavMenuServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/NavMenuServiceImpl.java#L282-L291) |
| 图标是字符串 key，前端 5 处 `iconMap` 做映射（未命中直接当 SvgIcon 名用） | [FirstSidebar.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/FirstSidebar.tsx#L14-L56)、[SecondSidebar.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/SecondSidebar.tsx#L9-L51)、[CustomNavPanel.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/CustomNavPanel.tsx#L4)、[MoreMenuDrawer.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/MoreMenuDrawer.tsx#L6)、[MenuManagement.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/MenuManagement.tsx#L120) |

**已查库现状（`material_system_react`）**：

- `nav_menu` 有效记录 62 条，一级 16 条，层级分布 `level 0/1/2`，即**支持一级 + 二级 + 三级**。
- 一级业务菜单示例：`purchase-center`（sort 2）、`material-center`（3）、`settings-center`（4）……`message-center`（12，无 path、无子菜单的空壳）。
- `menu_category` 分布：`C` 41、`M` 24、`NULL` 21。该字段只被权限树用于过滤按钮（`F`），前端菜单渲染不使用（[SysPermissionServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/SysPermissionServiceImpl.java#L175-L179)）。
- **非默认域必须配置 `sys_domain_menu`，否则菜单不显示**（`getTreeListByDomainId` 在域菜单为空时直接返回空列表，[NavMenuServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/NavMenuServiceImpl.java#L59-L68)）。当前域：1 壹品设计、2 工匠平台、9 产品设计。

### 1.2 路由结构

**结论：扁平路由，全部静态注册在 `/` 的 children 下，没有 meta、没有按权限动态生成、路由与菜单仅靠 `path` 字符串对应。**

| 事实 | 证据 |
|------|------|
| 所有业务页平铺在 `MainLayout` 的 children 中（约 70 条），如 `purchase-demand`、`craftsman-search` | [router/index.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/router/index.tsx#L99-L179) |
| 路由对象只有 `path` / `element` / `errorElement`，**没有 `meta` 字段**（无标题、无权限码、无 keepAlive） | [router/index.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/router/index.tsx#L88-L181) |
| 未匹配路径兜底到 `BuildingView` | [router/index.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/router/index.tsx#L178) |
| 鉴权只有"本地是否存了 token" | [RequireAuth.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/RequireAuth.tsx#L8-L17) |
| 菜单路径被点击后由 `navigate(menu.path)` 触发；页签与二级菜单高亮通过 `navigateToPath(path)` 反查菜单树 | [FirstSidebar.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/FirstSidebar.tsx#L222-L246)、[SecondSidebar.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/SecondSidebar.tsx#L134-L176) |

**含义**：新增审批中心必须同时改两处——`nav_menu` 数据 + `router/index.tsx` 静态路由；只加菜单不加路由会落到 `BuildingView` 占位页。

### 1.3 权限模型

**结论：只有"菜单可见性"级别的半套 RBAC，没有后端接口鉴权，没有按钮权限码落地。**

| 维度 | 现状 | 证据 |
|------|------|------|
| 登录 | 明文密码比对，token = Base64(`id:username:时间戳`)，无签名、无过期、服务端不校验 | [AuthServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/AuthServiceImpl.java#L44-L56) |
| 后端鉴权 | **没有任何 `HandlerInterceptor` / Security Filter / `@PreAuthorize`**；`WebMvcConfig` 只配了静态资源映射 | [WebMvcConfig.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/config/WebMvcConfig.java#L8-L22)（全仓 grep 无拦截器实现） |
| 菜单权限 | 后端按 `userId` 查 `sys_user_role → sys_role_menu` 过滤菜单树；`ROLE_ADMIN` 直接放行 | [NavMenuServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/NavMenuServiceImpl.java#L110-L140) |
| 按钮权限码 | 字段 `perms` 存在，但**全库 62 条菜单 `perms` 均为 NULL**；权限查询页自己提示"现有菜单未配置 perms 字段" | [PermissionQuery.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/PermissionQuery.tsx#L251-L256)（已查库确认） |
| 前端权限校验 | 无 `hasPermission` 之类工具；除 `RequireAuth` 外无页面/按钮级判断 | 全仓 grep 仅命中类型定义与权限查询页 |
| 数据权限 | 有模型无执行：`sys_role.data_scope` 1 全部 / 2 自定义部门 / 3 本部门 / 4 本部门及以下 / 5 仅本人；只在权限查询里做展示聚合，业务查询未落地 | [SysPermissionServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/SysPermissionServiceImpl.java#L87-L123) |
| 现状数据 | 5 个角色（ROLE_ADMIN / ROLE_DEV / ROLE_SALES / ROLE_SALES_LEADER / ROLE_FINANCE）、3 条用户角色、159 条角色菜单 | 已查库 |

**含义**：审批是强权限业务（谁能审、能审哪张单、能看哪些字段），当前底座不足以支撑"数据级"审批隔离，必须先把鉴权补上（见第 5 节阶段 0）。

### 1.4 后端与数据库

| 项 | 值 | 证据 |
|----|----|------|
| Spring Boot | **3.2.5** | [pom.xml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/pom.xml#L8-L13) |
| Java | **17** | [pom.xml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/pom.xml#L21-L23) |
| Spring Framework | 6.1.x（按 Boot 3.2.5 依赖矩阵推断，未跑 `dependency:tree`） | — |
| Jackson | 2.15.x（同上，推断） | — |
| MyBatis-Plus | 3.5.6（`mybatis-plus-spring-boot3-starter`） | [pom.xml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/pom.xml#L23-L38) |
| Flyway | **7.15.0**，有意锁定，注释写明"最后一个支持 MySQL 5.7 的社区版" | [pom.xml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/pom.xml#L24-L25)、[pom.xml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/pom.xml#L46-L52) |
| 数据源 | **单数据源**，MySQL，无多数据源配置 | [application.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/resources/application.yml#L4-L16) |
| 数据库版本（本机） | **MySQL 8.0.45** | `SELECT VERSION()` |
| 迁移管理 | Flyway，`classpath:db/migration`，`baseline-on-migrate=true`，当前已执行到 **V31** | [application.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/resources/application.yml#L21-L29)、`flyway_schema_history` |
| 迁移命名 | `V{递增整数}__{snake_case描述}.sql`，如 `V31__db_meta_seed.sql` | [db/migration](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/resources/db/migration) |
| Maven 结构 | **单模块**（`material-system-server/pom.xml` 无 `<modules>`），不是多模块工程 | [pom.xml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/pom.xml) |
| 现有表 | 40 张，无任何 `ACT_*` / 工作流 / 待办 / 消息表 | `SHOW TABLES` |
| 端口 | 前端 3001 / 后端 8081 / MySQL 3307→3306 容器 | `application.yml`、CLAUDE.md |
| **审批服务目标栈（新建 `approval-server`）** | **Spring Boot 3.5.16 + Flowable 7.2.0 + JDK 17 + Jackson 2**；显式锁定 `mysql-connector-j` 8.3.0 与 `flyway-core` 7.15.0；数据源为生产同实例 MySQL 5.7 的独立 schema `material_approval` | 见 2.3、2.4 与施工单 3.2 |

### 1.5 组织架构（审批人推导可行性）

| 事实 | 证据 |
|------|------|
| `sys_user`：`id/username/password/nickname/real_name/dept_id/phone/email/status`，**没有 manager_id / 上级主管字段** | [SysUser.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/entity/SysUser.java#L8-L40)、`DESC sys_user` |
| `sys_dept`：`parent_id / ancestors / dept_name / dept_code / sort_order / leader_user_id`，**有部门负责人字段** | [SysDept.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/entity/SysDept.java#L11-L38)、`DESC sys_dept` |
| 角色与关系表：`sys_role`（含 `data_scope`）、`sys_user_role`、`sys_role_menu`、`sys_role_dept` | [SysRole.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/entity/SysRole.java#L9-L33) |
| **已查库**：7 个部门中 `leader_user_id` 有值的 = **0 条**；用户 3 个；用户角色 3 条 | `SELECT ... FROM sys_dept` / `sys_user` |

**结论**：
- "部门负责人审批"可用 `sys_dept.leader_user_id`，但**当前数据全空，必须先治理**。
- "直属上级审批"（跨部门按人汇报线）**不具备**，需要新增 `sys_user.manager_id`；但已决策为 **P1 增强，不进 P0**，P0 只使用部门负责人 `leader_user_id`。
- `sys_role` 可直接映射为 Flowable 候选组（candidate group）；`sys_dept` 可映射为部门候选组。

### 1.6 表单体系

**结论：存在"低代码列表/表单生成器"，但不是审批表单引擎；现有业务表单是手写页面。**

| 事实 | 证据 |
|------|------|
| 已有页面生成器：`page_definition.schema_json` 存字段配置，支持列表/详情/表单三类模板 | [PageDefinition.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/entity/PageDefinition.java#L8-L52)、`DESC page_definition`（23 条配置） |
| 动态表单页可渲染 `input / input-number / select / select-multi / radio / cascader / date / daterange / status` | [DynamicFormPage.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/DynamicFormPage.tsx#L25-L61) |
| 但它是"单表 CRUD 表单"，无流程节点、无字段级权限、无版本化表单绑定 | 同上；`page_definition` 无 `process/form_version` 相关列 |
| 现有业务页（材料申请、施工申请、工匠申请、采购单据等）均为手写 React 页面 | [router/index.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/router/index.tsx#L20-L86) |
| 现有"审批"只是状态字段，如 `material_application.status`、`craftsman_application.status`（draft/pending/approved/rejected） | `DESC material_application` / `DESC craftsman_application`；[MaterialList.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/list/MaterialList.tsx#L21-L24) |
| 课程/题库页的"提交审批"只弹确认框改状态，无流程实例 | [CourseManage.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/CourseManage.tsx#L227-L244) |

**结论**：审批表单**不能直接复用页面生成器**（缺节点字段权限、表单版本、流程绑定）。可复用其 `schema_json + BaseInfoForm` 的渲染思路，另建审批表单模板表与渲染器。

### 1.7 company-ui 可复用组件

当前安装版本 **1.3.1**（[package.json](file:///Users/xiongdongying/ai_project/yph-react/react-system/package.json#L15)、`node_modules/@donglegeyu/company-ui/package.json`）。

| 需求 | 可复用 | 说明 |
|------|--------|------|
| 审批步骤/流程图节点进度 | `CompanySteps`（antd `StepsProps` 透传） | 适合"串行节点进度"展示 |
| 审批记录时间线 | `CompanyTimeline`（含 `Item`） | 适合审批历史/抄送记录 |
| 单据信息展示 | `CompanyDescriptions`、`CompanyCard` | 详情页头部 |
| 附件 | `CompanyUpload`、`CompanyAttachments`、`CompanyFileCard` | 审批附件上传/预览 |
| 选人/转办 | `CompanyTransfer`、`CompanySelect`、`CompanyModal` | 转办、加签选人 |
| 统计 | `CompanyStatistic`、`CompanyChart`、`StatisticsListPage` 模板 | 审批统计页 |
| **审批/流程专用组件** | **无** | 没有审批流、BPMN 画布、流程设计器类组件；需要自建或引入 `bpmn-js` |

### 1.8 是否已有工作流 / 待办 / 消息通知

**结论：完全没有。**

- 后端 grep `flowable|activiti|camunda|workflow` 无命中（仅文档草稿里提到"不做审批流"）。
- 数据库 40 张表无待办、通知、消息、流程实例相关表。
- 前端无待办中心、消息中心页面（`message-center` 只是空菜单壳，`parent_id=0`、无 path、无子菜单）。
- `AiAssistantAside` / `AiActionGuard` 只放行 `navigate`（[AiNavigationBridge.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/ai/AiNavigationBridge.tsx#L67-L115)），与审批无关。

### 1.9 待确认项（已清零）

原核查清单中的三项已全部落地：

| 原待确认项 | 结论 |
|-----------|------|
| 生产 MySQL 版本 | 已改为技术核验项，见 2.4；不再是需求决策 |
| 独立服务与部署形态 | 已决策：新建 `approval-server`，接受新增服务/端口 |
| 试点单据 | 已决策：材料申请，见 3.4 |

**当前无未决项。** T0 已从"决定是否换库"的硬门禁，降级为 MySQL 5.7 兼容性核验（见 2.4）：确认 5.7 下驱动 / 引擎 / Flyway 可用与建库权限，不再阻塞开工。

### 1.10 已锁定决策清单

| # | 决策 | 锁定值 |
|---|------|--------|
| 1 | 引擎与服务形态 | Flowable **7.2.0** + Spring Boot **3.5.16** + **JDK 17**（Jackson 2），新建 `approval-server`；现有后端版本三件套（Boot 3.2.5 / Jackson 2 / Flyway 7.15）不动。**已接受 Boot 3.5 与 Flowable 7.x 的 OSS EOL 状态**，补偿措施与责任人见第 6 节 |
| 2 | 上级审批人推导 | P0 用 `sys_dept.leader_user_id`；先补部门负责人数据；`sys_user.manager_id` 列为 P1 增强，不进 P0 |
| 3 | 数据保留 | 审批实例与审批记录**永久保留**；附件随业务单据生命周期；归档表按 **3 年** |
| 4 | 试点单据 | **材料申请 `material_application`** |
| 5 | MySQL 版本 | **生产 MySQL 5.7 为目标环境，不升级数据库**；审批库为同实例 + 独立 schema `material_approval`，见 2.4 |

---

## 2. 第二步：版本决策

### 2.1 现状与约束

- 现有后端：**Spring Boot 3.2.5 + Spring Framework 6.1.x + Jackson 2.15.x + Java 17 + Flyway 7.15.0 + MyBatis-Plus 3.5.6**（单模块、单数据源）。
- Flyway 7.15 是**为了兼容生产 MySQL 5.7** 特意降级的（pom 注释明确）。
- AI 助手链路大量使用 Jackson 2 的 `ObjectMapper` / `JsonNode`（如 `PageGeneratorPatchProtocol`、`AiContextPromptBuilder`、`PagePatchStreamFilter`），是 Jackson 升级的最大爆炸半径。

### 2.2 四个选项对比

| 选项 | 需要连带升级 | 风险 | 结论 |
|------|-------------|------|------|
| **A. 现有服务直接升 Boot 4 + Flowable 8** | Spring Boot 3.2→4、Spring Framework 6→7、Jackson 2→3（AI 全链路重写）、MyBatis-Plus 升 Boot4 starter、Flyway 7.15→11（**丢掉 MySQL 5.7**）、Tomcat 11 / Jakarta EE 11、springdoc 升级、Lombok 兼容性 | **极高**。等于把整个中台做一次大版本迁移，AI 模块和数据库迁移链同时受冲击，回归面覆盖全部 60+ 页面 | ❌ 不推荐 |
| **B. 现有服务内嵌 Flowable 7.2** | 需把主服务升到 Boot 3.3/3.4（Flowable 7.2 对应 Boot 3.3→3.4，OSS 7.2.0 基线为 Boot 3.x 后期版本）；Jackson 仍是 2，改动小；但 Flyway 7.15 与 Boot 3.4 自动配置存在兼容风险，MyBatis-Plus 需小幅升级 | **中高**。业务代码改动少，但"为了一个 7.x 终版引擎"去动主服务版本，收益低；且 7.x **已无维护分支、不再出补丁** | ⚠️ 备选 |
| **C. 新增独立模块 `approval-server` + Flowable 8 + Boot 4** | 新模块从零起：Java 21、Boot 4、Flowable 8、独立数据源、独立 Flyway（或 Flowable 自建表）；现有服务**一行不动** | **中**。风险被隔离在新服务内；主要成本是多一个服务/端口/部署单元，以及生产 MySQL 版本需 ≥ 8.0 | ❌ **已作废（2026-11 方案变更）**：生产 MySQL 5.7 不能升级，且需新建 JDK 21 镜像；新结论见选项 D |
| **D. 新增独立模块 `approval-server` + Flowable 7.2.0 + Boot 3.5.16 + JDK 17** | 新模块从零起：JDK 17、Boot 3.5.16、Flowable 7.2.0、Jackson 2、独立数据源、独立 Flyway（锁 7.15.0）；现有服务**一行不动** | **中低**。可原样复用现有 JDK 17 构建/运行时镜像；可直接使用生产 MySQL 5.7 同实例的独立 schema；风险集中在 Flyway 7.15 与 Boot 3.5 自动配置兼容，以及 Flowable 7.2 在 5.7 上尚未实测 | ✅ **采用（2026-11 方案变更）** |

**为什么从 C 切换到 D**：

1. **生产 MySQL 5.7 不能升级**。选项 C 的技术前提是"审批库必须 8.0 实例"，这会把上线卡在采购/运维流程上；选项 D 直接落在同实例的独立 schema，改动最小、上线最快。
2. **CI 阻塞消失**。C 需要私有仓库里并不存在的 JDK 21 构建/运行时镜像；D 的 JDK 17 镜像已在现有后端流水线中使用，无需新建。
3. **EOL 已被明确接受**。D 的代价是 Boot 3.5 / Flowable 7.x 无官方补丁，这一步已由需求方书面确认，并转为可管理的长期风险（见第 6 节），而不是隐藏选项。

### 2.3 已锁定决策

**决策：选 D —— Flowable 7.2.0 + Spring Boot 3.5.16 + JDK 17（Jackson 2），同仓库新增独立模块 `approval-server`。**

理由：

1. **上线最快、改动最小**。Boot 3.5.16 + JDK 17 可原样复用现有 `base-image:jdk17-gradle8.14-mvn3.9-ci-v1.0.0` 与 `openjdk:17-sky8.9` 镜像；不需要新建 JDK 21 镜像，也不需要为审批单独采购 MySQL 8.0 实例。
2. **MySQL 5.7 是硬约束**。生产不能升级数据库，因此必须显式锁定两个依赖：`mysql-connector-j:8.3.0`（Boot 3.5.16 默认 9.7.0，9.x 不再支持 5.7）与 `flyway-core:7.15.0`（Boot 3.5.16 默认 11.7.2，Flyway 10+ 不支持 5.7；7.15 的 MySQL 支持在 core 内，**不要**引入 `flyway-mysql`）。
3. **EOL 已接受**。Flowable 7.2 是 7.x 最后一版，Boot 3.5 的 OSS 支持也已于 2026-06 结束，两者都没有官方补丁通道。需求方已书面接受该状态，并以"内部补丁流程 + 依赖安全巡检 + 商业支持评估 + 运行时缓解 + 升级预案"补偿，责任人见第 6 节。
4. **独立模块仍能隔离破坏性升级**。Flowable 8 / Boot 4 只在审批服务内部演进，不会传导到 AI 助手、页面生成器、60+ 业务页面；**Flowable 8 作为"生产 MySQL 升到 8.0 之后"的升级目标保留**。
5. **改造现有模块的成本仍高于新模块**：现有服务的 AI 链路深度依赖 Jackson 2，Flyway 又被 MySQL 5.7 锁死，升 Boot 4 不是"改几个依赖"，而是两到三个月的迁移项目。

**模块边界（锁定）**：

- 新模块目录：`/Users/xiongdongying/ai_project/yph-react/approval-server/`，与 `material-system-server` 平级，独立 `pom.xml`，**不并入现有父工程**，现有构建链路零影响。
- 端口 **8082**；前端 Vite/nginx 增加 `/api/approval` 代理。
- 技术基线：Boot 3.5.16 + Flowable 7.2.0 + JDK 17 + Jackson 2；不 import `flowable-dependencies` BOM，Spring/Jackson 由 Boot parent 管理。
- 数据库：生产 MySQL 5.7 **同实例 + 独立 schema** `material_approval`（见 4.5），Flowable 自动建 `ACT_*`，业务表 `appr_*`，迁移历史表 `flyway_schema_history_approval`。
- 迁移执行：**已实测** Boot 3.5 的 Flyway 自动配置与 Flyway 7.15 不兼容（`NoSuchMethodError: FluentConfiguration.placeholderSeparator(String)`），处置为 `spring.flyway.enabled=false` + 程序化 Flyway 7.15 API 手动迁移；只关闭自动配置，不绕过迁移。
- 与主服务：读组织数据走主服务内部 API（本地缓存）；业务状态回写走带签名的内部回调（见施工单 3.4）。
- 现有后端**只做三处增量**：JWT 签发、内部组织/回调接口、权限码数据；不改版本、不改数据源、不改 Flyway。

### 2.4 MySQL 版本结论（5.7 为目标环境）

| 证据 | 内容 | 判定 |
|------|------|------|
| 本地运行实例 | `SELECT VERSION()` = **8.0.45** | 确证 |
| [docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/docker-compose.yml#L2-L18) | 镜像固定 `mysql:8.0`，字符集 `utf8mb4` / `utf8mb4_unicode_ci`，启用 `mysql_native_password` | 确证（开发编排） |
| [pom.xml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/pom.xml#L21-L25) | 注释："Flyway 降级到 7.15.0：支持服务器 MySQL 5.7（社区版 9.x 不再支持 MySQL 5.7）" | 确证（对生产版本的声明） |
| [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L1-L73) | 只有镜像构建与 Kuboard 更新镜像，**不含任何数据库版本定义** | 确证（CI 无法佐证） |
| init / migration 脚本语法 | 仅使用 `DATETIME DEFAULT CURRENT_TIMESTAMP`、`utf8mb4`、`ENGINE=InnoDB` 等 5.7 也支持的语法，未使用 8.0 专属特性（如 `utf8mb4_0900_ai_ci`、窗口函数、`CHECK` 约束） | 确证（语法上 5.7/8.0 双兼容） |

**结论**：**生产 MySQL 5.7 是目标环境**（需求方已锁定"生产数据库不升级"）。开发/联调环境是 8.0.45，与生产存在版本差异，这是本方案必须显式管理的已知差异。审批库不再要求独立 8.0 实例，采用**同实例 + 独立 schema `material_approval`**。

**在 5.7 上必须锁定的依赖**（Boot 3.5.16 的默认值都不支持 5.7）：

| 组件 | Boot 3.5.16 默认 | 5.7 兼容判断 | 处置 |
|------|------------------|--------------|------|
| MySQL 驱动 | `mysql-connector-j:9.7.0` | 9.x 已不再支持 MySQL 5.7 | **显式锁 `8.3.0`** |
| Flyway | `flyway-core:11.7.2` | Flyway 10+ 不支持 5.7 | **显式锁 `7.15.0`**；MySQL 支持在 core 内，**不要**引入 `flyway-mysql` |
| Flowable | 不托管（用 7.2.0） | 7.2.0 在 5.7 上**未实测** | 由 T0 兼容性核验确认；失败则保留原始报错并升级决策 |
| Jackson | 2.21.4（Flowable 7.2.0 基线 2.19.2） | 同属 Jackson 2.x，无版本门槛 | 默认不显式对齐，序列化异常时再回退 2.19.2 |

**未验证事实（必须如实保留）**：Flowable 7.2.0 在 MySQL 5.7 上**尚未实测**——本地只有 MySQL 8.0（`material-mysql-react`，3307），5.7 镜像无法拉取。因此：

1. H2 2.x 可用 `MODE=LEGACY` 完成引擎功能验证，但**不能证明 5.7 兼容性**；
2. Connector 8.3 连接 MySQL 8.0 需要 `allowPublicKeyRetrieval=true`（5.7 的 `mysql_native_password` 不需要，保留无害）；
3. 5.7 下的引擎建表与运行时行为，只能由 T0 用真实 5.7 环境（临时容器或预发）确认。

**建库要求**：

1. `CREATE DATABASE material_approval DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. 审批服务账号需要该 schema 的 `CREATE/ALTER/INDEX/SELECT/INSERT/UPDATE/DELETE` 权限（Flowable 首次启动要建 `ACT_*`）。
3. 连接串增加 `useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=UTF-8`；不需要为 5.7 单独调整认证插件。

**T0 兼容性核验（不再是硬门禁）**：确认 ① 生产 5.7 具体版本号；② 是否允许创建 schema `material_approval` 及授权；③ 驱动 8.3.0 / Flyway 7.15.0 / Flowable 7.2.0 在 5.7 上可用。若 Flowable 7.2 在 5.7 上验证失败，按"保留失败现场 + 升级决策"处理（可选：为审批单独准备 8.0 实例、或调整引擎版本），**不再预设"必须 8.0 实例"**。

**是否阻塞开工**：

- **不阻塞骨架编码**（本地 8.0.45 可完整开发调试，H2 可做引擎验证）。
- **不阻塞建库**：5.7 下建库是既定路径；T0 的结论只影响连接参数与是否需要备选部署形态。

---

## 3. 第三步：审批中心菜单规划（核心输出）

### 3.1 一级菜单与子菜单总览

一级菜单：**审批中心**，`key = approval-center`，`menu_type = 业务菜单`，`menu_category = M`，`parent_id = 0`，`level = 0`，`sort = 13`（排在"消息中心"之后），图标复用 `check-circle`（现有 `iconMap` 已映射为 `list`）。

| # | 子菜单 | 建议路由 | 页面职责（一句话） | 主要功能点 | 依赖后端接口 | 优先级 |
|---|--------|---------|-------------------|-----------|-------------|--------|
| 1 | 待我审批 | `/approval/todo` | 集中处理当前登录人的待办任务 | 待办列表（流程名/标题/发起人/到达时间/紧急度）、批量审批、同意/驳回、加签/转办入口、查看流程图与审批历史 | `GET /api/approval/tasks/todo`<br>`GET /api/approval/tasks/{taskId}`<br>`POST /api/approval/tasks/{taskId}/approve`<br>`POST /api/approval/tasks/{taskId}/reject`<br>`POST /api/approval/tasks/{taskId}/transfer`<br>`POST /api/approval/tasks/{taskId}/add-sign`<br>`GET /api/approval/instances/{id}/timeline` | **P0** |
| 2 | 我发起的 | `/approval/mine` | 查看我提交的单据及流转进度 | 我发起的列表、状态筛选、查看进度、撤回（仅首节点未处理）、催办、再次发起 | `GET /api/approval/instances/mine`<br>`GET /api/approval/instances/{id}`<br>`POST /api/approval/instances/{id}/withdraw`<br>`POST /api/approval/instances/{id}/urge` | **P0** |
| 3 | 已办与抄送 | `/approval/done` | 查看我处理过的和历史抄送给我的单据 | 三个页签：已办结 / 我审批过的 / 抄送我的；抄送未读标记、批量已读、跳转详情 | `GET /api/approval/instances/done`<br>`GET /api/approval/instances/approved`<br>`GET /api/approval/cc/mine`<br>`POST /api/approval/cc/{id}/read` | **P0** |
| 4 | 发起审批 | `/approval/start` | 流程超市，选择流程并发起 | 流程分类、流程卡片（图标/说明/平均耗时）、搜索、常用流程、动态表单填写、保存草稿、提交 | `GET /api/approval/process-definitions/startable`<br>`GET /api/approval/categories`<br>`GET /api/approval/forms/{formKey}`<br>`POST /api/approval/instances`<br>`POST /api/approval/drafts` | **P0** |
| 5 | 流程管理 | `/approval/admin/process` | 流程定义、版本与表单的后台配置 | 流程列表、启用/停用、版本列表与回滚、BPMN 设计器（全屏 `/approval/admin/process/:id/design`）、表单模板列表与设计器（全屏 `/approval/admin/form/:id/design`）、节点表单绑定 | `GET/POST/PUT /api/approval/admin/process-definitions`<br>`POST /api/approval/admin/process-definitions/{id}/deploy`<br>`GET /api/approval/admin/process-definitions/{id}/versions`<br>`GET/POST/PUT /api/approval/admin/forms`<br>`POST /api/approval/admin/forms/{id}/publish` | **P1** |
| 6 | 审批统计 | `/approval/stats` | 审批效率与积压情况分析 | 总览卡片（待办数/平均耗时/超时率）、按流程统计、按部门统计、趋势图、导出 | `GET /api/approval/stats/overview`<br>`GET /api/approval/stats/by-process`<br>`GET /api/approval/stats/by-dept`<br>`GET /api/approval/stats/trend` | **P1** |

**合计 6 个子菜单**（P0 4 个、P1 2 个）。

### 3.2 P0 取舍与合并理由

**P0 必须先上（4 个）的理由**：这 4 个页面构成一个可闭环的最小可用链路——"发起 → 待办 → 审批 → 我发起/已办 → 撤回/抄送"。缺任意一个，用户无法完成一次真实审批，系统没有上线价值。

**P1 后置（2 个）的理由**：

- **流程管理**：P0 阶段流程定义由实施人员通过部署包/管理接口预置（1~3 条试点流程），业务用户不需要自助建模；等试点流程跑通、建模规范稳定后再开放设计器，避免早期被业务方随意改流程导致引擎数据混乱。
- **审批统计**：统计依赖历史数据积累，上线首周数据没有参考价值；且 `ACT_HI_*` 历史表在并发审批下写入量大，需要先观察一轮再做聚合。

**合并说明（不贪多）**：

| 合并动作 | 理由 |
|---------|------|
| "已办 / 我审批过的 / 抄送我的"合并为 1 个菜单（3 个页签） | 三者都是"只读的历史记录"，用户心智一致；拆成 3 个一级子菜单会让审批中心出现 8 个入口，与现有导航"一级 6 个 + 更多"的容量冲突 |
| "流程定义 + 版本管理 + 表单设计"合并为 1 个"流程管理"菜单（内部页签 + 全屏设计器路由） | 表单与流程定义强绑定（节点绑定表单），使用人群同为流程管理员；设计器本身是全屏页面，不需要独立菜单入口 |
| 不单列"审批代理""消息通知""草稿箱" | 代理与通知属 P2 增强；草稿入口放在"发起审批"页内的"草稿"页签即可，避免菜单膨胀 |

### 3.3 菜单如何挂进现有体系

**结论：写数据库 `nav_menu` + 补 `sys_domain_menu` / `sys_role_menu` + 改前端路由与图标映射。数据库变更必须走 Flyway（项目硬性规则）。**

#### （1）Flyway 脚本

新增 `material-system-server/src/main/resources/db/migration/V32__approval_center_menus.sql`（版本号接当前 V31；已核对与现有迁移不冲突，并已在主库执行成功，脚本不可再修改），全部使用幂等写法：

```sql
-- 一级菜单：审批中心
INSERT INTO nav_menu (`key`, label, path, parent_id, level, sort, menu_type, menu_category, icon, status, visible, deleted)
SELECT 'approval-center', '审批中心', NULL, 0, 0, 13, '业务菜单', 'M', 'check-circle', 1, 1, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-center' AND deleted = 0);

-- 子菜单（以“待我审批”为例，其余 5 个同构）
INSERT INTO nav_menu (`key`, label, path, parent_id, level, sort, menu_type, menu_category, icon, status, visible, deleted)
SELECT 'approval-todo', '待我审批', '/approval/todo',
       (SELECT id FROM nav_menu WHERE `key` = 'approval-center' AND deleted = 0 LIMIT 1),
       1, 1, '业务菜单', 'C', 'list', 1, 1, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-todo' AND deleted = 0);

-- 非默认域需要域菜单行（1 壹品设计、2 工匠平台、9 产品设计）
INSERT INTO sys_domain_menu (domain_id, menu_id, sort)
SELECT d.id, m.id, 13
FROM sys_domain d
JOIN nav_menu m ON m.`key` = 'approval-center'
WHERE d.id IN (1, 2, 9)
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu dm WHERE dm.domain_id = d.id AND dm.menu_id = m.id
  );

-- 非管理员角色需要显式授权（ROLE_ADMIN 在代码里直接放行）
INSERT INTO sys_role_menu (role_id, menu_id, create_time)
SELECT r.id, m.id, NOW()
FROM sys_role r
JOIN nav_menu m ON m.`key` IN ('approval-center', 'approval-todo')
WHERE r.role_code IN ('ROLE_DEV', 'ROLE_SALES', 'ROLE_SALES_LEADER', 'ROLE_FINANCE')
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu rm WHERE rm.role_id = r.id AND rm.menu_id = m.id
  );
```

> 注意：不要写 `UPDATE nav_menu SET level/sort`（会覆盖用户在菜单管理页的手工配置，违反项目规则）；`sys_domain_menu` 的子菜单行同样要补，否则非默认域只看到一级目录。

#### （2）前端改动点

| 文件 | 改什么 |
|------|--------|
| [router/index.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/router/index.tsx#L99-L179) | 在 `MainLayout` children 内新增 6 条路由（含 2 条全屏设计器路由） |
| [FirstSidebar.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/FirstSidebar.tsx#L14-L56)、[SecondSidebar.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/SecondSidebar.tsx#L9-L51)、[CustomNavPanel.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/CustomNavPanel.tsx#L4)、[MoreMenuDrawer.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/components/layout/MoreMenuDrawer.tsx#L6)、[MenuManagement.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/MenuManagement.tsx#L120) | 如果新菜单图标不复用现有 key，需在 5 处 `iconMap` 同步补充；复用 `check-circle` 则无需改动 |
| `src/constants/api.ts` | 增加 `/approval/**` 接口常量 |
| `vite.config.ts` | 增加 `/api/approval` 代理到 8082 |

#### （3）菜单数据形态说明

| 字段 | 一级"审批中心" | 子菜单示例"待我审批" |
|------|---------------|---------------------|
| `key` | `approval-center` | `approval-todo` |
| `label` | 审批中心 | 待我审批 |
| `path` | `NULL` | `/approval/todo` |
| `parent_id` | `0` | 一级菜单 id |
| `level` | `0` | `1` |
| `sort` | `13` | `1..6` |
| `menu_type` | `业务菜单` | `业务菜单` |
| `menu_category` | `M`（目录） | `C`（菜单） |
| `icon` | `check-circle` | 按子菜单取 `list`/`file`/`check-square` 等 |
| `status` / `visible` / `deleted` | `1 / 1 / 0` | `1 / 1 / 0` |

---

### 3.4 试点单据选择（已锁定）

**选择：材料申请 `material_application`。**

选择理由：

1. **审批通过后无任何写副作用**。后端只有列表/详情/新增/修改/删除五个接口（[MaterialApplicationController.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/controller/MaterialApplicationController.java#L88-L111)），没有 `approve()` 之类的业务动作，不会像工匠申请那样在通过后写主表。
2. **无金额计算**。实体只有 `quantity` / `materialQuantity`（数量），没有单价、金额、税额字段（[MaterialApplication.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/entity/MaterialApplication.java#L8-L45)）。
3. **无跨模块依赖**。不触发库存、采购、财务、合同、发票等任何下游逻辑。
4. **已有审批状态语义**。状态值 `draft / pending / approved / rejected` 已存在（[MaterialApplicationController.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/controller/MaterialApplicationController.java#L113-L122)），接入流程后可与旧状态平滑映射。
5. **审批链最短**。单人提交 → 部门负责人一级审批即可闭环，天然匹配"用 `sys_dept.leader_user_id` 推导上级"的 P0 策略。

**被排除的候选及原因**：

| 候选 | 排除原因 |
|------|---------|
| 工匠申请 `craftsman_application` | 审批通过会创建工匠主表记录（[CraftsmanApplicationServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/CraftsmanApplicationServiceImpl.java#L122-L143)），存在业务写副作用，不适合作为第一个试点。**建议作为第二个接入对象** |
| 施工申请 `construction_application` | 有 `budget decimal(15,2)` 预算字段（已查库），涉及金额，排除 |
| 采购需求/订单/退货/价格申请 | 涉及金额、库存、财务与跨模块；且本库中 `SHOW TABLES LIKE '%purchase%'` 为空（已查库），当前没有可承接的后端表，排除 |
| 课程/题库"提交审批" | 只有前端确认框改状态，无后端表、无状态机（[CourseManage.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/CourseManage.tsx#L227-L244)），无法作为真实试点 |
| 请假/报销等通用 OA 单据 | 现系统不存在，需要先造业务表，违背"用现有单据验证引擎"的初衷 |

**结论**：不需要退化为"通用单据审批"抽象壳，现有模块中存在合适候选。试点范围锁定为材料申请的**单级审批**（提交 → 部门负责人审批 → 通过/驳回），审批动作通过内部回调把 `material_application.status` 回写为主服务状态值。

## 4. 第四步：接入方案

### 4.1 引擎接入方式：嵌入式 Java API（不用 REST 外部服务）

**推荐：嵌入式 Java API**（`flowable-spring-boot-starter-process`），理由：

1. **事务边界清晰**：审批实例、`ACT_*` 运行时数据与 `appr_*` 业务关联表在审批库同一数据源内，可保证审批动作的原子性；业务单据状态通过带重试的回调最终一致，不需要引入分布式事务框架。
2. **组织数据可缓存**：审批人表达式需要读 `sys_user/sys_dept/sys_role`，通过主服务内部只读接口 + 本地缓存（5 分钟 TTL）解决，避免每次审批都跨服务实时调用，也不需要两个服务共享数据源。
3. **现有团队能力**：后端是 Spring Boot 单体，引入 starter 的心智负担远低于维护一个 Flowable REST 集群。
4. **部署简单**：不额外引入 Flowable UI / REST 应用，减少运维面。

**前提**：独立 `approval-server` 持有自己的 `DataSource`（独立 schema `material_approval`），Flowable 自动建 `ACT_*` 表；业务扩展表由该服务自己的 Flyway 管理（独立历史表）。

技术与部署前提（2026-11 方案变更后）：

- 技术栈为 **Boot 3.5.16 + Flowable 7.2.0 + JDK 17 + Jackson 2**；不 import `flowable-dependencies` BOM，Spring/Jackson 由 Boot parent 管理（Boot 托管 2.21.4，Flowable 基线 2.19.2，同大版本，默认不对齐）。
- 审批库与主库 **同实例（生产 MySQL 5.7）+ 独立 schema**，**不再要求独立 8.0 实例**。
- 迁移由显式锁定的 `flyway-core:7.15.0` 执行：Boot 3.5 的 Flyway 自动配置与 7.15 不兼容（已实测 `NoSuchMethodError: FluentConfiguration.placeholderSeparator(String)`），因此 `spring.flyway.enabled=false` + 程序化 Flyway 7.15 API 手动迁移；历史表沿用 `flyway_schema_history_approval`。

### 4.2 设计器策略：bpmn-js 自建

| 方案 | 评价 | 结论 |
|------|------|------|
| **bpmn-js 自建** | 前端 npm 依赖，离线可控，支持 BPMN 2.0 全量建模与自定义属性面板；需要自己做中文属性面板、校验、部署 | ✅ 推荐 |
| Flowable 云端免费账号（Flowable Design） | 需外网、数据出域、账号与权限另管，且与嵌入式引擎的部署链路割裂 | ❌ 不推荐 |
| 第三方低代码流程平台 | 引入新供应商与授权成本，且难以与现有 `nav_menu`/权限体系融合 | ❌ 不推荐 |

**实现建议**：`bpmn-js` + `bpmn-js-properties-panel` + `flowable-bpmn-moddle`（Flowable 扩展属性），前端全屏设计器只负责产出 BPMN XML，部署动作由后端调用 `RepositoryService.createDeployment()`。P0 阶段可先用 XML 模板预置，设计器放 P1。

### 4.3 组织模型映射

| 现有模型 | Flowable 概念 | 映射规则 |
|---------|--------------|---------|
| `sys_user.id` | `assignee` / `candidateUser` | 统一转字符串 `${userId}` |
| `sys_role.role_code` | `candidateGroup`（groupId = roleCode） | 如 `ROLE_FINANCE` → 财务角色候选组 |
| `sys_dept.id` / `sys_dept.dept_code` | `candidateGroup`（groupId = `DEPT_{id}`） | 部门候选组 |
| `sys_user.dept_id` + `sys_dept.leader_user_id` | 上级审批人 | `${approvalResolver.deptLeader(execution)}` |
| `sys_user.manager_id`（**P1 增强，不进 P0**） | 直属主管 | `${approvalResolver.managerOf(applicantId)}`，为空时回退部门负责人 |
| 发起人 | `initiator` | `${initiator}`（Flowable 内置） |

**审批人表达式示例（BPMN 中）**：

```text
${approvalResolver.managerOf(execution.getVariable('applicantId'))}          -- 直属主管
${approvalResolver.deptLeader(execution.getVariable('applicantDeptId'))}     -- 部门负责人
${approvalResolver.roleUsers('ROLE_FINANCE')}                                -- 角色成员（会签/或签候选）
${approvalResolver.formFieldUser('nextApproverId')}                          -- 表单自选审批人
```

`approvalResolver` 是审批服务内的 Spring Bean，返回值统一为 `String`（单人）或 `List<String>`（多人），并负责空值兜底（找不到审批人时抛业务异常，禁止静默跳过）。

**必须配套的数据治理（P0 范围）**：

- **补齐 7 个部门的 `leader_user_id`**（当前全空），否则"部门负责人"规则全部失效；这是 P0 开工的前置数据任务。
- 审批人解析遇到空值时**抛业务异常并阻断提交**（提示"未配置部门负责人，请联系管理员"），禁止静默跳过或降级为管理员审批。
- `sys_user.manager_id` 仅作为 P1 增强，不建字段、不改表、不阻塞 P0；后续按"直属汇报线"精细化时再补。

### 4.4 自研清单（难度 + 工作量量级）

| 能力 | 难度 | 实现要点 | 工作量量级 |
|------|------|---------|-----------|
| 或签 | 低 | `candidateUsers/candidateGroups`，任一人完成即推进 | 3–5 天 |
| 会签 | 中 | 多实例 `multiInstanceLoopCharacteristics` + 完成条件（全票/比例） | 1–2 周 |
| 加签 | 中高 | 前加签/后加签：动态创建任务、父子任务关系、审批记录 | 2–3 周 |
| 转办 | 低中 | `taskService.setAssignee()` + 操作留痕 | 3–5 天 |
| 驳回 | 中 | 驳回到指定节点（`changeActivityState`）或发起人；需处理节点变量与历史 | 1–2 周 |
| 撤回 | 中 | 仅首节点未处理时允许；`deleteProcessInstance` 或回退执行实例 | 1 周 |
| 抄送 | 低 | 节点监听器写 `appr_cc`，不参与流程推进 | 3–5 天 |
| 条件分支 | 中 | 排他网关 + 表达式编辑器 + 变量校验 | 1–2 周 |
| 动态表单 | 高 | schema 渲染器、校验、版本化、节点字段权限、数据存储 | 3–6 周 |
| 审批人规则 | 高 | 主管/角色/部门/表单字段/发起人自选，含空值兜底与预览 | 2–4 周 |
| 流程图与审批记录 UI | 低 | `CompanySteps` + `CompanyTimeline` + 只读 BPMN 预览 | 3–5 天 |

### 4.5 数据表方案

**隔离策略（已锁定）：独立 schema `material_approval` + 前缀隔离。**

- Flowable 自带表：默认 `ACT_` 前缀（`ACT_RE_*` 定义、`ACT_RU_*` 运行时、`ACT_HI_*` 历史、`ACT_GE_*` 通用），由 Flowable 启动时自动建表。
- 业务扩展表：统一 `appr_` 前缀，由审批服务自己的 Flyway 管理（独立历史表 `flyway_schema_history_approval`）。
- **选择独立 schema 而非同库同 schema 的理由**：
  1. **备份与归档独立**：审批实例/记录永久保留、归档按 3 年，独立 schema 可单独制定备份与归档策略，不影响主库。
  2. **升级互不影响**：Flowable 升级只动 `ACT_*`，不会触碰主服务 Flyway 迁移链；主服务新增 `nav_menu` 数据也不会与 `ACT_*` 混在一起。
  3. **服务边界清晰**：主服务不共享数据源，只提供内部组织查询与状态回写接口，避免"两个服务写同一个 schema"的隐性耦合。
- **代价与对应措施**：组织数据不能直接 JOIN → 主服务内部只读接口 + 本地缓存（5 分钟 TTL）；跨服务回写失败 → 本地 `appr_callback_log` + 重试 + 人工补偿。
- **部署形态**：默认与主库**同实例（生产 MySQL 5.7）+ 独立 schema `material_approval`**；独立 8.0 实例只是可选部署形态（例如 5.7 兼容性核验失败时的备选），不是前提。连接串走 `APPROVAL_DB_URL`，不写死。

**业务扩展表草案**：

```sql
-- 审批业务单据关联（唯一真相源是流程实例，业务表状态仅作冗余快照）
CREATE TABLE IF NOT EXISTS appr_business_link (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_instance_id VARCHAR(64) NOT NULL,
  process_def_key   VARCHAR(128) NOT NULL,
  business_type     VARCHAR(64)  NOT NULL,   -- material_application / craftsman_application / ...
  business_id       BIGINT       NOT NULL,
  business_no       VARCHAR(64),
  title             VARCHAR(255) NOT NULL,
  applicant_id      BIGINT       NOT NULL,
  applicant_dept_id BIGINT,
  status            VARCHAR(32)  NOT NULL,   -- draft/running/approved/rejected/canceled
  form_key          VARCHAR(64),
  form_version      INT,
  form_data         JSON,
  create_time       DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_process_instance (process_instance_id),
  KEY idx_applicant (applicant_id, status),
  KEY idx_business (business_type, business_id)
);

-- 审批动作流水（同意/驳回/转办/加签/撤回/抄送）
CREATE TABLE IF NOT EXISTS appr_task_action (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_instance_id VARCHAR(64) NOT NULL,
  task_id           VARCHAR(64),
  task_def_key      VARCHAR(128),
  task_name         VARCHAR(128),
  action            VARCHAR(32) NOT NULL,    -- approve/reject/transfer/add_sign/withdraw/cc
  operator_id       BIGINT NOT NULL,
  operator_name     VARCHAR(64),
  comment           VARCHAR(1000),
  create_time       DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_instance (process_instance_id),
  KEY idx_operator (operator_id, create_time)
);

-- 审批附件
CREATE TABLE IF NOT EXISTS appr_attachment (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_instance_id VARCHAR(64) NOT NULL,
  task_id           VARCHAR(64),
  file_name         VARCHAR(255) NOT NULL,
  file_url          VARCHAR(500) NOT NULL,
  file_size         BIGINT,
  uploader_id       BIGINT NOT NULL,
  create_time       DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_instance (process_instance_id)
);

-- 抄送
CREATE TABLE IF NOT EXISTS appr_cc (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_instance_id VARCHAR(64) NOT NULL,
  task_id           VARCHAR(64),
  receiver_id       BIGINT NOT NULL,
  read_status       TINYINT DEFAULT 0,
  read_time         DATETIME,
  create_time       DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_instance_receiver (process_instance_id, receiver_id),
  KEY idx_receiver (receiver_id, read_status)
);

-- 审批表单模板（版本化）
CREATE TABLE IF NOT EXISTS appr_form_template (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  form_key      VARCHAR(64) NOT NULL,
  form_name     VARCHAR(128) NOT NULL,
  version       INT NOT NULL,
  schema_json   MEDIUMTEXT NOT NULL,
  status        VARCHAR(20) DEFAULT 'draft',  -- draft/published/archived
  created_by    BIGINT,
  create_time   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_form_version (form_key, version)
);

-- 流程定义与表单绑定
CREATE TABLE IF NOT EXISTS appr_process_form (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_def_key VARCHAR(128) NOT NULL,
  form_key        VARCHAR(64) NOT NULL,
  form_version    INT NOT NULL,
  node_key        VARCHAR(128),               -- 为空表示流程级表单
  UNIQUE KEY uk_process_node (process_def_key, node_key)
);

-- 主服务状态回写日志（跨服务最终一致）
CREATE TABLE IF NOT EXISTS appr_callback_log (
  id                BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_instance_id VARCHAR(64) NOT NULL,
  target_url        VARCHAR(255) NOT NULL,
  payload           TEXT,
  status            VARCHAR(20) NOT NULL,     -- pending/success/failed
  retry_count       INT DEFAULT 0,
  last_error        VARCHAR(500),
  create_time       DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_status (status, retry_count)
);

-- 审批单号序列（按业务类型 + 日期）
CREATE TABLE IF NOT EXISTS appr_sequence (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  biz_type      VARCHAR(32) NOT NULL,
  seq_date      CHAR(8) NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_type_date (biz_type, seq_date)
);
```

### 4.6 与现有 AI 助手的关系（只给判断）

**判断：审批写操作不纳入 AiActionGuard。**

- 现状 `AiActionGuard` 只放行 `navigate`，`open-record` 等都拒绝（[AiNavigationBridge.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/ai/AiNavigationBridge.tsx#L110-L122)）。
- 审批"同意/驳回/加签"属于高风险写操作，且当前后端无鉴权、无幂等保障、审计依赖新建表；首期让 AI 直接执行会放大误操作与越权风险。
- 建议保持"AI 只能导航到待办/详情页"，写操作由用户在表单内确认提交；后续若接入，再单独评审幂等键、二次确认与审计字段。

---

## 5. 第五步：路线图

| 阶段 | 目标 | 交付物 | 依赖 | 工作量量级 |
|------|------|--------|------|-----------|
| **阶段 0：权限底座与数据准备（P0 前置，不可跳过）** | 让审批"可安全上线" | ① 主服务 JWT 签发 + 拦截器 + `@RequirePerm` ② 审批服务 JWT 校验 + 同名注解拦截器 ③ `nav_menu.perms` 权限码落库（按钮行）④ 前端 `hasPerm` / `<PermissionGuard>`，与后端共用同一套权限码 ⑤ 补齐 7 个部门 `leader_user_id` ⑥ T0 MySQL 5.7 兼容性核验（驱动 / 引擎 / Flyway + 建库权限） | DBA/运维（建库与权限）、HR（部门负责人数据） | **2–3 周**（可与阶段 1 编码并行，但作为 P0 上线验收门禁） |
| **阶段 1：P0 骨架 + 试点闭环** | 材料申请一条真实流程端到端跑通 | ① `approval-server` 独立模块（Boot 3.5.16 + Flowable 7.2.0 + JDK 17 + 独立 schema，MySQL 5.7 可用）② `ACT_*` 自动建表 + `appr_*` 扩展表 ③ 审批人解析器（部门负责人）+ 或签 ④ 材料申请 BPMN（单级）⑤ 4 个 P0 菜单页（待办/我发起/已办抄送/发起）⑥ 菜单 Flyway + 6 条前端路由 + 内部回调接口 | 阶段 0 的 JWT 与权限码（编码可并行，联调需就绪）；T0 兼容性核验完成 | **3–4 周** |
| **阶段 2：流程与表单设计能力** | 业务可自助配置 | ① bpmn-js 设计器（含 Flowable 属性面板）② 表单模板设计器与版本发布 ③ 流程-表单-节点绑定 ④ 会签、条件分支、审批人规则 ⑤ 流程管理菜单上线 | 阶段 1 | **1 个月+** |
| **阶段 3：高级动作与统计** | 覆盖真实审批场景 | ① 加签、转办、驳回、抄送 ② 催办与站内通知 ③ 审批统计看板 ④ 归档任务（按 3 年） | 阶段 2 | **3–4 周** |
| **阶段 4：业务接入与推广** | 存量单据逐步迁移 | ① 工匠申请（第二个试点，需处理通过后写主表）② 施工申请（涉及预算，需财务确认）③ 采购单据在补齐后端表后接入 ④ 旧状态字段与新流程实例的双写/对账 ⑤ 灰度与回滚预案 | 阶段 3 + 业务方配合 | **持续迭代** |

**阶段 0 是 P0 上线门禁**：

- **不阻塞开工**：阶段 1 的模块骨架、BPMN、审批 API 可以并行开发（本地联调用临时 token）。
- **阻塞 P0 上线**：没有后端鉴权与权限码，审批接口等于裸奔；没有部门负责人数据，审批人解析直接失败。两项都完成才允许进入灰度。
- 详细改动点见第一阶段施工单的 T1、T2。

---

## 6. 待确认清单

**功能与版本决策均已锁定**（见 1.10）：独立服务、汇报线来源、数据保留、试点单据、MySQL 5.7 目标环境、技术栈版本组合。

**T0 不再是开工门禁**，而是 MySQL 5.7 兼容性核验（见 2.4 与施工单 T0）：确认 5.7 下驱动 8.3.0 / Flyway 7.15.0 / Flowable 7.2.0 可用与建库权限。它不阻塞骨架编码，也不再决定"是否换库"。

**新增待确认：EOL 补偿措施与责任人**（Boot 3.5 与 Flowable 7.x 均已过 OSS 支持窗口）：

| # | 补偿措施 | 内容 | 责任方 | 状态 |
|---|---------|------|--------|------|
| 1 | 内部补丁流程 | `approval-server` 建立私有补丁分支规范：安全修复以最小 patch cherry-pick，记录补丁来源、CVE 与验证结论 | 后端负责人 | 待书面确认 |
| 2 | 依赖安全巡检 | 每月对 `approval-server` 跑 SCA（OWASP Dependency-Check / Trivy / 公司现有工具）；高危 7 天内评估、30 天内修复或缓解 | 安全 + 运维 | 待书面确认 |
| 3 | 商业支持评估 | 针对 Boot 3.5 的 CVE 响应，评估购买 Spring 商业支持或采用公司统一长期支持基线 | 架构 + 采购 | 待评估 |
| 4 | 运行时缓解 | 审批服务只在内网暴露；网关/WAF 限制 `/api/approval/**`；严格 JWT 与权限码，缩小攻击面 | 运维 | 待书面确认 |
| 5 | 版本冻结与升级触发器 | 冻结 Flowable 7.2.0 与 Boot 3.5.16；生产 MySQL 升到 8.0 或 Flowable 8 支持 5.7 时启动升级评估 | 架构负责人 | 已定 |

**EOL 接受边界**：可接受"内网 + 最小暴露面 + 月度巡检"的短期（6–12 个月）运行；不可接受公网暴露，或在没有 SCA 与补丁流程的情况下长期运行；需安全负责人确认"接受无官方补丁"、运维确认"内网隔离与巡检落地"、架构负责人确认"升级触发器"。
