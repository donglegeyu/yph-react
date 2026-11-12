# 方案调整说明：Spring Boot 3.5.16 + Flowable 7.2.0 + JDK 17 + Jackson 2

> 状态：待确认。本文件只做差异盘点，**未修改**三份原文档、**未改代码**、**未提交**。
> 日期：2026-11-11
> 变更前方案：[Flowable 8.0.x + Boot 4 + JDK 21](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md)
> 变更后方案：**Flowable 7.2.0 + Spring Boot 3.5.16 + JDK 17 + Jackson 2**
> 变更理由（已由需求方锁定）：生产 MySQL 5.7 不能升级；要求改动最小、上线最快；已明确接受 Boot 3.5 与 Flowable 7.x 的 OSS EOL 状态。

---

## 0. 结论摘要

| 项目 | 变更前结论 | 变更后结论 |
|------|-----------|-----------|
| 引擎与服务 | Flowable 8.0.x；独立 `approval-server`；Boot 4 + Java 21 | **Flowable 7.2.0；独立 `approval-server`；Boot 3.5.16 + Java 17** |
| Jackson | Boot 4 默认 Jackson 3，Flowable 8 内部 Jackson 2，需处理双版本共存 | **统一 Jackson 2**；Boot 3.5.16 托管 2.21.4，Flowable 7.2.0 基线 2.19.2，同大版本，默认不显式对齐 |
| 数据库 | 审批库必须 MySQL 8.0；生产若 5.7 则阻塞建库/联调 | **可直接使用生产同实例 + 独立 schema `material_approval`（MySQL 5.7）**；不再要求 8.0 实例 |
| JDBC 驱动 | 由 Boot 管理（Boot 4 为 9.x） | **必须显式锁 `mysql-connector-j:8.3.0`**；Boot 3.5.16 默认 9.7.0，9.x 不再支持 5.7 |
| Flyway | Boot 4 托管的新版本，需 MySQL 8.0 | **必须显式锁 `flyway-core:7.15.0`**；Boot 3.5.16 默认 11.7.2，不支持 5.7；`7.15` 的 MySQL 支持在 core 内，不引入 `flyway-mysql` |
| CI 镜像 | 最大阻塞：私有仓库缺 JDK 21 构建/运行时镜像 | **阻塞消失**：直接复用现有 `base-image:jdk17-gradle8.14-mvn3.9-ci-v1.0.0` 与 `openjdk:17-sky8.9` |
| 菜单迁移版本 | 规划用 V32 | **V32 可用**：已核对 `db/migration` 最新为 V31，无版本冲突 |
| 回滚 | 3 步改 tag，有顺序要求；审批库迁移只前进 | **结论不变**；跨服务 JWT 契约耦合仍在；MySQL 版本风险从回滚风险中移除 |
| 新增风险 | Flowable 8 与 Boot 4 的依赖冲突 | **EOL 风险成为首要新增风险**：Boot 3.5 OSS 支持已于 2026-06 结束；Flowable 7.x 无维护分支 |

**一句话判断**：这次变更让"部署与数据库"从高不确定变为低不确定，代价是把"无补丁"的 EOL 风险从选项备注提升为必须显式管理的长期风险。

---

## 1. 作废的结论

以下结论在新版本组合下**不再成立**，后续改文档时必须删除或改写，不能只做补充。

| # | 原结论 | 出处 | 为什么不成立 |
|---|--------|------|-------------|
| 1 | 引擎版本锁定 Flowable **8.0.x** | 规划 [0 执行摘要](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md#L14)、[1.10 #1](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md#L166)、[2.3](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md#L192) | 新决策为 Flowable **7.2.0** |
| 2 | 审批服务使用 **Boot 4 + Java 21** | 规划 0、1.10、2.3；施工单 [3.2](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-phase1-orders.md#L198-L229) | 新决策为 **Boot 3.5.16 + Java 17** |
| 3 | Boot 4 默认 Jackson 3，需处理 Jackson 2/3 双版本共存；自定义代码用 Jackson 3 | 施工单 [3.2 注意 1](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-phase1-orders.md#L233)、[9 风险](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-phase1-orders.md#L542-L543) | Boot 3.5 仍是 **Jackson 2**，不存在 Jackson 3 |
| 4 | springdoc 必须升级到 **3.x** | 施工单 [3.2 注意 3](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-phase1-orders.md#L235) | springdoc 3.x 面向 Boot 4；Boot 3.5 对应 springdoc 2.x。P0 可直接**不引入** springdoc |
| 5 | 需要升级 **MyBatis-Plus 的 Boot 4 starter** | 规划 [2.2 选项 A](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md#L186) | `approval-server` 既定方案使用 JdbcTemplate，不引入 MyBatis-Plus；主服务版本也不动 |
| 6 | 审批库**必须独立 MySQL 8.0 实例**；生产 5.7 会阻塞建库/联调 | 规划 [2.4](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md#L220-L229)、施工单 [0](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-phase1-orders.md#L15-L16) | 新方案接受 MySQL 5.7；**同实例 + 独立 schema** 即可，不需要 8.0 实例 |
| 7 | Flowable 8 面向 MySQL 8.0+，5.7 不在支持矩阵内 | 规划 [2.4](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md#L220) | Flowable 7.2.0 的 MySQL 支持需按 7.x 矩阵核验；新方案不再以"必须 8.0"为前提 |
| 8 | **JDK 21 私有镜像是唯一完全阻塞构建的项** | CI 影响 [0](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/approval-server-ci-impact.md#L19)、[2.F](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/approval-server-ci-impact.md#L204-L219)、[4 风险 #1](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/approval-server-ci-impact.md#L262) | JDK 17 构建/运行时镜像已在用；不需要新建 JDK 21 镜像 |
| 9 | Boot 4 需要新建 Maven 3.9+ 构建镜像 | CI 影响 [2.F](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/approval-server-ci-impact.md#L212) | 现有 `jdk17-gradle8.14-mvn3.9-ci-v1.0.0` 自带 Maven 3.9，Boot 3.5 满足 |
| 10 | **T0 生产 MySQL 版本核验是硬门禁**，5.7 则阻塞建库 | 规划 [2.4](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md#L226-L229)、施工单 [T0](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-phase1-orders.md#L434-L441) | 5.7 已被接受；T0 从"决定是否换库"降级为"确认 5.7 下的驱动/引擎/Flyway 兼容性 + 建库权限" |
| 11 | 独立 schema 的核心原因之一是**隔离 MySQL 版本风险** | 规划 [4.5](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md#L436-L440) | 版本隔离理由消失；独立 schema 仍保留，但理由改为备份/归档独立、升级互不影响、服务边界清晰 |
| 12 | 新 Dockerfile 需要 **JDK 21 多阶段** | CI 影响 [3 改动清单 #3](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/approval-server-ci-impact.md#L246) | 改为复用现有 JDK 17 多阶段构建，新增 Dockerfile 但不新增基础镜像 |
| 13 | `springdoc-openapi-starter-webmvc-ui` 使用 3.x | 施工单 3.2 | P0 不引入；若引入，用 2.8.x（Boot 3.5 适配线） |

---

## 2. 需要改动的结论

### 2.1 `approval-server` 用 JDK 17，CI 是否还需要新建镜像？

**结论：不需要新建 JDK 镜像，直接复用现有两个基础镜像；仍需新增 `build-approval` 与 `deploy-approval-recode` 两个 job。**

| 项 | 现状 | 新方案 |
|----|------|--------|
| 构建镜像 | `registry.zrhsh.com/library/base-image:jdk17-gradle8.14-mvn3.9-ci-v1.0.0` | **原样复用**，`maven.compiler.release=17` |
| 运行时镜像 | `registry.zrhsh.com/library/openjdk:17-sky8.9` | **原样复用** |
| CI 默认镜像 | `base-image-jdk11:0.0.1`，只跑 docker CLI | 不变；不参与 Java 编译 |
| 新模块 Dockerfile | 原方案要求 JDK 21 多阶段 | 复制现有后端 Dockerfile，构建上下文改为 `approval-server/`，基础镜像不变 |
| CI job | `build-approval` + `deploy-approval-recode` | **仍需要**；现有 4 个 job 硬编码目录，无自动发现能力，这部分结论不变 |

**注意**：

1. 本机只有 JDK 24，构建时用 `--release 17`；生产运行仍是 JDK 17，不改变交付基线。
2. 现有构建镜像的命名含 `jdk17`，但 `openjdk:17-sky8.9` 是公司定制运行时；Flowable 7.2 的 `jdk.version=17`，匹配。
3. CI 的明文凭据问题与本次版本变更无关，仍建议按 CI 影响文档第 G 节迁移到 GitLab Variables，但不在本阶段执行。

### 2.2 数据库：能否回到同实例 + 独立 schema `material_approval`（MySQL 5.7）？

**结论：可以，且这是新方案的默认形态。但必须锁两个依赖版本，并验证 Flowable 7.2 在 5.7 上的实际行为。**

| 组件 | Boot 3.5.16 默认 | Flowable 7.2.0 基线 | 5.7 兼容判断 | 处置 |
|------|------------------|---------------------|--------------|------|
| MySQL 驱动 | `mysql-connector-j:9.7.0`（[Boot 3.5.16 POM](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-dependencies/3.5.16/spring-boot-dependencies-3.5.16.pom)，`mysql.version`） | `9.4.0`（Flowable `flowable-dependencies-7.2.0.pom`，`mysql-connector.version`） | 9.x 已不再支持 MySQL 5.7 | **显式锁 `8.3.0`**（Connector/J 8.x 支持 5.7） |
| Flyway | `11.7.2`（Boot 3.5.16，`flyway.version`） | 不强制 | Flyway 10+ 不支持 5.7 | **显式锁 `7.15.0`**；MySQL 支持在 `flyway-core` 内，**不要**引入 `flyway-mysql` |
| Flowable | 不托管 | 7.2.0 | 7.x 对 5.7 的支持需核验；若官方已移除，则退化为"同实例但审批 schema 用 8.0 实例" | Step 2 用真实 5.7 容器或官方矩阵确认；失败则保留原始报错并升级决策 |
| Flowable 建表 | — | `flowable.database-schema-update=true` | ACT_* 由引擎自建 | 保持 |
| 业务表 | — | 独立 Flyway 历史表 | `appr_*` 由审批服务迁移 | `flyway_schema_history_approval` |

**关键风险（新增）**：Boot 3.5 的 `FlywayAutoConfiguration` 是按 Flyway 11 编写的，降级到 7.15.0 可能出现 `NoSuchMethodError`。

- 首选：保留 `spring.flyway.enabled=true` + `flyway-core:7.15.0`，先验证自动配置能否工作。
- 若自动配置不兼容：**不改变"用 Flyway 管理迁移"的事实**，改为在 `approval-server` 内用 `@Configuration` 以 Flyway 7.15 的 Java API 手动执行迁移，并设置 `spring.flyway.enabled=false` 只关闭 Boot 自动配置（不是绕过迁移）。这一点需要在实施前确认可接受。

**建库要求**：

- `CREATE DATABASE material_approval DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
- 审批服务账号需要该 schema 的 `CREATE/ALTER/INDEX/SELECT/INSERT/UPDATE/DELETE` 权限（Flowable 首次启动要建 `ACT_*`）。
- 连接串增加 `useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=UTF-8`；5.7 不需要 `allowPublicKeyRetrieval`（该参数主要面向 8.0 的 `caching_sha2_password`，保留也无害）。

### 2.3 Flowable 7.2.0 的基线是 Boot 3.5.4，配合 3.5.16 是否需要额外处理？

**结论：不需要额外处理，但必须做一次依赖树与启动验证。**

证据：Flowable 7.2.0 的 `flowable-dependencies-7.2.0.pom` 明确：

```text
spring.boot.version = 3.5.4
jackson.version     = 2.19.2
mysql-connector.version = 9.4.0
jdk.version         = 17
```

判断：

1. **3.5.16 与 3.5.4 是同一 minor 的补丁差异**，Spring Framework 6.2.x 内部兼容；Flowable 的 starter 通过 `spring-boot-starter-jdbc` 等标准依赖接入，不依赖 3.5.4 的私有行为。
2. **不要 import `flowable-dependencies` BOM**。让 Boot 3.5.16 的 `spring-boot-starter-parent` 管理 Spring/Jackson/驱动版本，Flowable 只提供自身 `org.flowable:*` 的传递依赖。
3. Flowable 7.2.0 的 Maven 编译目标是 Java 17，与运行基线一致。
4. 需要验证的是"Boot 3.5.16 + Flowable 7.2.0 实际解析出的 Spring Framework / Jackson / Flowable 版本"，不是只看 POM 声明（Step 2 输出 `dependency:tree`）。

### 2.4 Jackson 2.19 与 Boot 3.5 托管的 Jackson 版本是否一致？是否需要显式对齐？

**结论：不一致，但同属 Jackson 2.x；默认使用 Boot 3.5.16 托管的 2.21.4，不显式对齐；只有在序列化验证失败时才回退到 2.19.2。**

| 来源 | Jackson 版本 |
|------|-------------|
| Flowable 7.2.0 基线 | **2.19.2**（`flowable-dependencies-7.2.0.pom`） |
| Boot 3.5.16 托管 | **2.21.4**（`spring-boot-dependencies-3.5.16.pom`，`jackson-bom.version`） |
| 实际生效 | 由当前工程的 `dependencyManagement` 决定；Boot parent 优先，默认应为 2.21.4 |

判断：

- Jackson 2.x 的 minor 升级保持二进制兼容，2.21 是 2.19 的超集；Flowable 7.2 的序列化器使用稳定 API。
- **不建议**为了"对齐 Flowable 基线"把 Jackson 降到 2.19.2，因为 Boot 3.5.16 自身可能依赖 2.21 的行为修复；降级会引入另一组未验证组合。
- 验证项：BPMN 部署、流程变量读写、任务查询、历史查询、REST JSON 序列化。若出现 `NoSuchMethodError` / 序列化差异，再通过 `<jackson-bom.version>2.19.2</jackson-bom.version>` 显式对齐，并保留失败现场。

### 2.5 菜单迁移脚本 V32 是否与现有版本号冲突？

**结论：不冲突。`db/migration` 当前最新为 `V31__db_meta_seed.sql`，`V32` 可用。**

- 已核对目录：[db/migration](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/resources/db/migration)
- 规则不变：脚本一旦执行不可修改；若在开工前有其他人插入 V32，则本脚本顺延为 V33，不改已执行脚本。
- 菜单脚本仍放**主服务**的 `db/migration`（它改的是主库 `nav_menu`），**不能**放进 `approval-server` 的迁移目录。

### 2.6 回滚策略是否变化？

**结论：核心不变，仍是"改镜像 tag + 有顺序要求"；MySQL 版本风险从回滚风险中移除，但 EOL 补丁风险上升。**

| 场景 | 变更前 | 变更后 |
|------|--------|--------|
| 只回滚审批服务 | 改 tag；注意主服务 JWT 契约 | **不变** |
| 只回滚主服务 | 改 tag；主服务回到 Base64 token 会让审批服务全挂 | **不变**（JWT 是跨服务契约） |
| 整体回滚 | 3 次改 tag：审批 → 主服务 → 前端 | **不变** |
| 数据库 | 审批库迁移只前进；回滚镜像不删表 | **不变**；同实例下仍建议发版前备份 `material_approval` |
| MySQL 版本 | 5.7 会阻塞，需要独立 8.0 实例 | **不再是回滚风险**；5.7 是目标环境 |
| 补丁能力 | Flowable 8 / Boot 4 有 OSS 补丁 | **EOL**：出问题只能内部修或买 EE，回滚不能解决安全漏洞 |

**回滚顺序仍建议**：先回滚审批服务（消费方），再回滚主服务（签发方），最后回滚前端（菜单隐藏）。主库 `nav_menu` 的 V32 数据不会自动回滚，需要同步停用菜单或接受 `/approval/*` 页面降级。

### 2.7 其他需要同步改写的表述

| 位置 | 原表述 | 新表述 |
|------|--------|--------|
| 规划 2.2 选项表 | A/B/C 三选项，C 为 Flowable 8 + Boot 4 | 增加/替换为 **D：独立模块 + Flowable 7.2 + Boot 3.5.16 + JDK 17**，并说明为什么接受 EOL |
| 规划 2.3 理由 | "8 是唯一有未来的版本" | 改为"当前约束下选 7.2 是**上线最快、改动最小**；8 作为 MySQL 8.0 可用后的升级目标" |
| 规划 4.1 前提 | "审批库必须是独立 8.0 实例" | 改为"同实例 + 独立 schema 即可；8.0 实例只是可选部署形态" |
| 规划 4.5 理由 1 | "隔离 MySQL 版本风险" | 改为"备份/归档独立、升级互不影响、服务边界清晰" |
| 规划 5 阶段 1 | "Boot 4 + Flowable 8 + 独立 schema" | "Boot 3.5.16 + Flowable 7.2 + 独立 schema（MySQL 5.7 可用）" |
| 施工单 0 | "MySQL 5.7 反证；T0 阻塞建库" | "MySQL 5.7 为目标环境；T0 改为兼容性核验，不再阻塞建库" |
| 施工单 3.2 | Boot 4.0.0 / Java 21 / Flowable 8.0.0 / springdoc 3.0.0 | Boot 3.5.16 / Java 17 / Flowable 7.2.0 / springdoc 2.8.x（或不引入）/ connector 8.3.0 / Flyway 7.15.0 |
| 施工单 3.4 | "主库可能是 5.7、审批库必须 8.0" | "同实例 5.7 + 独立 schema；不共享库的原因改为服务边界与迁移链隔离" |
| 施工单 9 风险 | "Boot 4 + Flowable 8 依赖冲突" | "Flyway 7.15 与 Boot 3.5 自动配置兼容性；Flowable 7.2 在 5.7 的实测兼容性；EOL 补丁风险" |
| CI 影响 0/F/4 | JDK 21 镜像缺失为最大风险 | 删除该风险；改为"复用 JDK 17 镜像，Dockerfile 复制现有后端即可" |
| CI 影响 2.D | 审批库必须是 8.0，否则 Flyway 11/Flowable 8 失败 | 审批库为 5.7；Flyway 锁 7.15.0，驱动锁 8.3.0；验证 Flowable 7.2 |
| CI 影响 3 改动清单 #3/#8 | 新增 JDK21 多阶段 Dockerfile / JDK21 镜像制作 | 改为"新增 Dockerfile，基础镜像复用 JDK17"；删除 #8 |

---

## 3. 新增风险：EOL 意味着什么，如何补偿，谁承担

### 3.1 EOL 的事实

| 组件 | 状态 | 影响 |
|------|------|------|
| Spring Boot 3.5 | OSS 支持窗口已结束（3.5 线 OSS 支持至 2026-06；当前 2026-11，3.5.16 属于商业支持补丁） | 不再有公开的 CVE 修复补丁；新漏洞只能等商业支持或自行修复 |
| Flowable 7.2.0 | 7.x 最后一个版本；官方主线转向 8.x，无 7.x 维护分支 | 引擎层 CVE、MySQL 驱动兼容、Jackson 兼容问题不会再有官方补丁 |
| MySQL Connector/J 8.3 | 非 LTS 创新版本，生命周期短于 8.4 LTS | 驱动层安全问题需要自行跟进 |

### 3.2 补偿措施

| 措施 | 内容 | 责任方 |
|------|------|--------|
| **内部补丁流程** | 建立 `approval-server` 的私有补丁分支规范：安全修复以最小 patch 形式 cherry-pick；记录补丁来源、CVE、验证结论 | 后端负责人 |
| **依赖安全巡检** | 每月对 `approval-server` 跑 SCA（OWASP Dependency-Check / Trivy / 公司现有工具）；高危漏洞 7 天内评估，30 天内修复或缓解 | 安全 + 运维 |
| **版本冻结与升级触发器** | 冻结 Flowable 7.2.0 与 Boot 3.5.16；当生产 MySQL 升到 8.0 或 Flowable 8 支持 5.7 时，启动升级评估 | 架构负责人 |
| **商业支持评估** | 对 Boot 3.5 的 CVE 响应，评估购买 Spring 商业支持或采用公司统一的长期支持基线 | 架构 + 采购 |
| **运行时缓解** | 审批服务只在内网暴露；网关/WAF 限制 `/api/approval/**`；严格 JWT 与权限码；减少攻击面 | 运维 |
| **升级预案** | 保持 `approval-server` 与主服务解耦（独立 schema、独立部署），确保未来可单独升级到 Flowable 8 / Boot 4 | 架构负责人 |

### 3.3 EOL 的接受边界

- **可接受**：短期（6–12 个月）内以"内网 + 最小暴露面 + 月度巡检"运行；业务价值优先于补丁新鲜度。
- **不可接受**：把审批服务暴露到公网；或在没有 SCA 与补丁流程的情况下长期运行；或把 Flowable 7.2 作为新业务平台的长期底座而不设升级触发器。
- **需要书面确认**：安全负责人确认"接受无官方补丁"的风险；运维确认"内网隔离与巡检"落地；架构负责人确认"升级触发器"。

---

## 4. 三份原文档的修改清单（确认后执行）

| 文档 | 章节 | 修改内容 |
|------|------|---------|
| `flowable-approval-center-plan.md` | 0 执行摘要 | 版本行、MySQL 行、最大风险行、推荐接入方式前的版本说明全部改为 Boot 3.5.16 + Flowable 7.2.0 + JDK 17 |
| 同上 | 1.4 后端与数据库 | 增加"审批服务目标栈"行；保留主服务 Boot 3.2.5 事实 |
| 同上 | 1.10 已锁定决策 #1 | 改为 Flowable 7.2.0 / Boot 3.5.16 / JDK 17；注明接受 EOL |
| 同上 | 2.2 选项对比 | 增加 D 选项；说明为何从 C 切换到 D |
| 同上 | 2.3 已锁定决策 | 重写理由：上线最快、改动最小、MySQL 5.7 约束、EOL 已接受 |
| 同上 | 2.4 MySQL 结论 | 改为"5.7 为目标环境"；保留证据表；删除"必须 8.0 实例"；T0 改为兼容性核验 |
| 同上 | 4.1 引擎接入 | 删除"审批库必须 8.0"；保留独立 schema + 独立数据源 |
| 同上 | 4.5 数据表方案 | 保留独立 schema；理由 1 改为备份/归档/升级/边界；部署形态改为"同实例 5.7 默认，8.0 可选" |
| 同上 | 5 路线图 | 阶段 1 技术栈改为 Boot 3.5.16 + Flowable 7.2；阶段 0 的 T0 描述调整 |
| 同上 | 6 待确认清单 | 增加"EOL 补偿措施与责任人"；T0 不再表述为硬门禁 |
| `flowable-approval-phase1-orders.md` | 0 执行摘要 | MySQL 结论、阻塞判断、技术门禁全部改写 |
| 同上 | 1 任务总览 | T0 名称改为"MySQL 5.7 兼容性核验"；量级不变 |
| 同上 | 3.2 pom 依赖清单 | Boot 3.5.16 / Java 17 / Flowable 7.2.0 / connector 8.3.0 / Flyway 7.15.0 / springdoc 2.8.x 或不引入；删除 Jackson 3 注意事项 |
| 同上 | 3.3 application.yml | 数据源指向 `material_approval`（5.7）；Flyway 配置与历史表；如需手动 Flyway 则补说明 |
| 同上 | 3.4 通信方式 | 删除"主库 5.7 / 审批库 8.0"的理由；改为服务边界与迁移链隔离 |
| 同上 | 4.1 数据库结论 | 同实例 + 独立 schema；8.0 实例为可选 |
| 同上 | 7 T0/T3/T4 | T0 验收改为"5.7 下驱动/引擎/Flyway 可用 + 有建库权限"；T3 验收增加实际解析版本；T4 验收不变 |
| 同上 | 9 风险与应对 | 用 3.1/3.2 的 EOL 风险替换 Boot 4/Jackson 3 风险；增加 Flyway 7.15 自动配置兼容性风险 |
| `approval-server-ci-impact.md` | 0 执行摘要 | JDK 21 行、MySQL 行、风险排序、改动量级改写 |
| 同上 | 1.2 Dockerfile | 增加"新模块复用 JDK17 基础镜像"的说明 |
| 同上 | 2.D 数据库 | 删除"审批库必须 8.0"；改为 5.7 + Flyway 7.15 + connector 8.3 |
| 同上 | 2.F JDK 要求 | 改为"JDK 17 镜像已存在；无需新建" |
| 同上 | 3 改动清单 #3/#8 | #3 改为复用 JDK17 的 Dockerfile；删除 #8 |
| 同上 | 4 风险排序 | 删除 JDK21 风险；新增"Flyway 7.15 兼容性"与"Flowable 7.2 在 5.7 的实测"；EOL 列为长期风险 |
| 同上 | 6 看不到的信息 | 删除"JDK 21 镜像"行；保留 K8s/nginx/生产 MySQL 信息 |

---

## 5. Step 2 验证计划（不改文档，先验证）

### 5.1 验证目标

1. Boot 3.5.16 + Flowable 7.2.0 依赖可解析，输出实际 Spring Framework / Jackson / Flowable 版本。
2. 应用可启动，能拿到 `ProcessEngine`。
3. 部署一个最小 BPMN、启动实例、查到任务。
4. 验证 Flyway 7.15.0 在 Boot 3.5.16 下的行为（自动配置是否可用；不可用则记录原始报错并给出程序化方案）。
5. 验证 MySQL 5.7 路径（如本机可起临时 5.7 容器）；若不可行，用 H2 完成引擎验证，并明确标注"5.7 未实测"。

### 5.2 验收标准

| 项 | 通过标准 |
|----|---------|
| 依赖解析 | `mvn dependency:tree` 成功；输出 Boot / Spring Framework / Jackson / Flowable / connector / Flyway 实际版本 |
| 启动 | 日志出现 `ProcessEngine` 初始化成功；无 `NoSuchMethodError` / `ClassNotFoundException` |
| BPMN | `repositoryService.createDeployment()` 成功；`ACT_RE_PROCDEF` 有记录 |
| 实例 | `runtimeService.startProcessInstanceByKey()` 成功；`taskService.createTaskQuery()` 能查到任务 |
| Flyway | `flyway_schema_history_approval` 存在，`V1` 执行成功（若用程序化 Flyway，日志需明确） |
| 失败处理 | 任何失败保留原始报错，不通过换版本静默绕过 |

### 5.3 验证环境说明

- 本机 JDK 24（仅此一个），Maven 3.9.16；编译用 `--release 17`。
- 本机 MySQL 为 `material-mysql-react`（8.0，3307），**不是 5.7**；5.7 需要临时容器或生产核验。
- H2 可用于引擎功能验证，但不能证明 5.7 兼容性；报告中必须区分"引擎验证"与"5.7 验证"。

---

## 6. 需要确认的事项

| # | 事项 | 建议 |
|---|------|------|
| 1 | 是否接受 Flyway 7.15 在 Boot 3.5 下改为**程序化执行**（若自动配置不兼容） | 建议接受；仍由 Flyway 管理迁移，不绕过迁移 |
| 2 | Connector/J 用 8.3.0 还是 8.4.x LTS | 按需求方给定的 8.3.0；若 8.4 确认支持 5.7，可优先 LTS（需实测） |
| 3 | 生产 MySQL 5.7 是否允许创建新 schema、审批账号权限是否可授予 | 需 DBA 书面确认 |
| 4 | EOL 补偿措施的责任人与书面确认 | 建议：架构负责人 + 安全 + 运维三方确认 |
| 5 | 是否允许为验证临时启动一个 MySQL 5.7 容器（独立名称/端口，验证后删除） | 建议允许；否则 5.7 只能等生产核验 |

---

## 7. 结论

- 版本变更**不会推翻**审批中心的菜单规划、试点单据、独立服务边界、独立 schema、权限底座、前后端页面范围；这些仍然成立。
- 需要重写的是**技术栈、依赖版本、数据库前提、CI 镜像判断、T0 门禁**，以及新增 **EOL 补偿机制**。
- 最大的新增风险不是技术集成，而是 **EOL 后的无补丁运行**；必须把"谁负责巡检、谁负责补丁、何时升级"写进文档，而不是只写"已接受 EOL"。
