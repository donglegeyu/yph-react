# 新增 `approval-server` 对现有发布流水线的影响评估

> 状态：只做分析，未改代码、未改流水线、未提交
> 日期：2026-11-11
> 技术栈（2026-11 方案变更后）：**Spring Boot 3.5.16 + Flowable 7.2.0 + JDK 17 + Jackson 2**；数据库为生产 MySQL 5.7 同实例 + 独立 schema
> 关联文档：[Flowable 接入规划](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-center-plan.md)、[第一阶段施工单](file:///Users/xiongdongying/ai_project/yph-react/docs/architecture/flowable-approval-phase1-orders.md)

---

## 0. 执行摘要

| 项目 | 结论 |
|------|------|
| 现有流水线是否自动纳入新模块 | **不会**。现有 4 个 job 全部硬编码目录与镜像名 |
| 需要新增 job | **2 个**：`build-approval`（构建推送）+ `deploy-approval-recode`（Kuboard 改镜像）；可复用 `before_script` 模板，但无现成通用模板 |
| 对现有镜像构建的影响 | **几乎为零**：构建上下文各自固定在子目录，新增平级目录不进入上下文；无聚合 pom；Docker 层缓存不失效 |
| 部署新增 | 本地 compose 加 1 个服务；生产 K8s 需运维新增 Deployment/Service/Secret + 前端 nginx 增加 `/api/approval` 反代（仓库内 nginx.conf 由运维维护，AI 只读） |
| 数据库 | 审批库 schema 由 DBA 在**生产 MySQL 5.7 同实例**上一次创建（`material_approval`）；建表由 `approval-server` 启动时 Flyway 7.15（程序化）+ Flowable 自动完成；必须显式锁 `mysql-connector-j:8.3.0` 与 `flyway-core:7.15.0`；失败只影响审批服务，不阻断主服务发布 |
| 回滚 | 仍是"改镜像 tag"，但跨服务 JWT/接口契约让回滚**有顺序要求**，审批库迁移**只能前进**，菜单数据不会自动回滚 |
| Java 17 / Boot 3.5.16 | 现有 CI 默认镜像 `base-image-jdk11` 只跑 docker CLI，**不参与编译**；构建与运行时**直接复用** `base-image:jdk17-gradle8.14-mvn3.9-ci-v1.0.0` 与 `openjdk:17-sky8.9`，**无需新建 JDK 21 镜像，也无需新建 Maven 3.9 镜像**（现有构建镜像已自带 Maven 3.9） |
| 改动量级 | 配置级：2 个 CI job + 1 个 Dockerfile（复用 JDK 17 基础镜像）+ 1 个 compose 服务 + 1 段 nginx + 1 套 K8s 对象 + 1 次建库；**不需要改现有 job** |
| 上线风险排序 | ① Flyway 7.15 与 Boot 3.5 自动配置兼容 ② Flowable 7.2.0 在 MySQL 5.7 上未实测 ③ K8s 与 nginx 路由排障 ④ 跨服务 JWT 回滚耦合 ⑤ 菜单指向不可用服务 ⑥ 构建上下文（最低） ⑦ EOL 无官方补丁（长期） |
| 是否建议灰度 job | **建议**：先加"只构建不部署"的 job，在 feature 分支验证镜像可启动，再开部署 job |

---

## 1. 现有发布链路核查

### 1.1 `.gitlab-ci.yml` 结构

| 项 | 现状 | 证据 |
|----|------|------|
| 默认镜像 | `registry.zrhsh.com/library/base-image-jdk11:0.0.1` | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L5) |
| stage | 只有 2 个：`build`、`deploy-recode` | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L11-L13) |
| 触发条件 | **没有 `rules` / `only` / `except`**，任何分支 push 都会跑 build；deploy 为 `when: manual` | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L90)、[.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L109) |
| job 依赖 | 无 `needs`、无 artifacts；build 两个 job 并行，deploy 两个 job 在下一 stage 并行 | 全文件 |
| 镜像命名 | `$REGISTRY/$HARBOR_PROJECT_GROUP/yph-react-backend:$VERSION`，`VERSION=分支名去斜杠-短SHA` | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L29-L40)、[.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L55-L66) |
| Runner | `tags: oceanet`，实际 executor 与是否挂载 Docker socket **仓库内看不到** | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L41-L42) |
| 部署方式 | 不是 SSH、不是 compose，而是 **curl 调 Kuboard API 改镜像 tag** | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L82-L86)、[.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L101-L105) |
| 手工确认 | 有：两个 deploy job 均为 `when: manual` | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L90)、[.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L109) |
| 测试/质量门禁 | **没有** test、lint、代码扫描 stage | 全文件 |
| 密钥管理 | 仓库凭据与 Kuboard AccessKey **明文写在 CI 文件里** | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L43-L45)、[.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L84) |

**判断**：这是一条"构建两个镜像 + 手工点两次改 tag"的最小流水线。**没有任何目录自动发现能力**，新增模块必须显式加 job。

### 1.2 前后端 Dockerfile

| 项 | 后端 | 前端 |
|----|------|------|
| 构建上下文 | `material-system-server`（`cd` 后 `.`） | `react-system` |
| 构建阶段基础镜像 | `registry.zrhsh.com/library/base-image:jdk17-gradle8.14-mvn3.9-ci-v1.0.0` | `registry.zrhsh.com/library/node:22-slim` |
| 运行时基础镜像 | `registry.zrhsh.com/library/openjdk:17-sky8.9` | `registry.zrhsh.com/library/nginx:alpine` |
| 多阶段 | 是：Maven 构建 → JRE 运行 | 是：npm 构建 → Nginx |
| 缓存策略 | 先 `COPY pom.xml` + `mvn dependency:go-offline`，再拷贝 `src` | 先 `COPY package*.json` + `npm ci`，再 `COPY . .` |
| 证据 | [Dockerfile](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/Dockerfile#L7-L25) | [Dockerfile](file:///Users/xiongdongying/ai_project/yph-react/react-system/Dockerfile#L7-L26) |

**补充**：

- 后端没有 `.dockerignore`（已确认），但 Dockerfile 只 `COPY pom.xml` 与 `src`，所以上下文里的 `target/`、日志不会进镜像，只影响上传耗时。
- 前端有 `.dockerignore`，排除了 `node_modules`、`dist`、`.git`、`docs` 等（[.dockerignore](file:///Users/xiongdongying/ai_project/yph-react/react-system/.dockerignore)）。
- 两个 Dockerfile 均**未使用 BuildKit cache mount**，Maven/npm 依赖缓存只靠 Docker 层。
- **新模块复用 JDK 17 基础镜像**：`approval-server/Dockerfile` 直接复制现有后端 Dockerfile，仅把构建上下文改为 `approval-server/`，构建阶段仍是 `base-image:jdk17-gradle8.14-mvn3.9-ci-v1.0.0`、运行时仍是 `openjdk:17-sky8.9`，并设置 `maven.compiler.release=17`；**不新增基础镜像**。

### 1.3 部署侧

| 项 | 现状 | 证据 |
|----|------|------|
| 仓库内编排 | 只有 `material-system-server/docker-compose.yml`，**2 个服务**：`mysql`、`backend`；前端不在 compose 中（本地跑 Vite 3001） | [docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/docker-compose.yml#L1-L52) |
| 组网 | compose 默认网络，服务名即 DNS：`material-mysql-react`、`backend` | [docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/docker-compose.yml#L2-L28) |
| 环境变量注入 | compose `environment` 注入 `SPRING_PROFILES_ACTIVE`、`SPRING_DATASOURCE_URL`、`DB_URL`、`DB_USERNAME`、`DB_PASSWORD`、`SPRING_FLYWAY_LOCATIONS` | [docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/docker-compose.yml#L26-L33) |
| 端口 | MySQL `3307:3306`、后端 `8081:8081` | [docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/docker-compose.yml#L6-L25) |
| 健康检查 | 后端 `curl -f http://localhost:8081/api/nav-menus` | [docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/docker-compose.yml#L40-L45) |
| 启动顺序 | `depends_on: mysql: service_started`（只等容器启动，不等就绪） | [docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/docker-compose.yml#L34-L36) |
| 资源限制 | **无 CPU / 内存限制** | 全文件 |
| 反向代理 | 前端 nginx `/api/` → `http://backend:8081/api/`，`/uploads/` → `backend:8081`，SPA fallback | [nginx.conf](file:///Users/xiongdongying/ai_project/yph-react/react-system/nginx.conf#L26-L44) |
| 生产部署形态 | **仓库内没有 K8s manifests / 生产 compose**。CI 只通过 Kuboard API 更新 `nrp-recode` 命名空间下的 `yph-react-backend`、`yph-react-frontend` 镜像 | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L80-L86) |

**重要区分**：仓库里的 `docker-compose.yml` 是**本地开发编排**；生产是 K8s（Kuboard 管理）。因此"加 compose 服务"只解决本地联调，生产还必须让运维加 K8s 对象——**这些对象不在仓库里，看不到**。

### 1.4 数据库迁移执行时机

| 项 | 现状 | 证据 |
|----|------|------|
| 执行者 | Spring Boot 启动时 Flyway 自动执行 | [application.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/resources/application.yml#L21-L29) |
| 位置 | `classpath:db/migration`；compose 通过 `SPRING_FLYWAY_LOCATIONS=filesystem:/app/migration` 覆盖为挂载目录 | [application.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/resources/application.yml#L23)、[docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/docker-compose.yml#L32-L33) |
| 与流水线关系 | **CI 不执行迁移**，只在应用启动时发生 | 全 CI 文件无 `flyway`/`mvn` 调用 |
| 失败影响 | 启动失败 → 容器退出 → compose healthcheck 不通过；K8s 中表现为 Pod CrashLoop，滚动更新卡住 | 推断（K8s 配置看不到） |
| 校验策略 | `validate-on-migrate: false` | [application.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/resources/application.yml#L29) |

### 1.5 服务数量与资源约束

- compose 仅定义 **2 个服务**（`mysql`、`backend`），无前端、无资源 limits/reservations（[docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/docker-compose.yml#L1-L52)）。
- 本机实际运行容器包含 `material-backend-react`、`material-mysql-react`（`docker ps` 已查），与 compose 一致。
- 生产 K8s 的副本数、requests/limits **看不到**。

### 1.6 CI 运行环境

| 项 | 现状 | 证据 |
|----|------|------|
| 默认镜像 | `base-image-jdk11:0.0.1` | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L5) |
| 镜像是否真的用 JDK 编译 | **不用**。job 只执行 `docker build` / `docker push` / `curl`，Maven 编译发生在 Dockerfile 的 jdk17 构建阶段 | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L25-L40)、[Dockerfile](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/Dockerfile#L7-L17) |
| Runner 类型 | 只知道 tag `oceanet`；executor、是否 dind、是否挂载宿主 Docker socket **仓库内无法确认** | [.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L41-L42) |
| Maven 本地仓库缓存 | **无**。没有 `cache:`、没有挂载 `~/.m2`、没有 BuildKit cache mount | 全 CI + Dockerfile |
| JDK 17 镜像 | 构建用 `jdk17-gradle8.14-mvn3.9-ci-v1.0.0`、运行时用 `openjdk:17-sky8.9`，均已在现有后端流水线中使用，**无需新建** | [Dockerfile](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/Dockerfile#L1-L7) |

---

## 2. 逐条判断

### A. 现有流水线是否会自动纳入新模块？需要新增哪些 job？

**结论：不会自动纳入。需要新增 2 个 job，可复用登录模板，但 job 主体需要复制。**

依据：两个 build job 都写死 `cd material-system-server` / `cd react-system`（[.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L32)、[.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L58)），镜像是固定名称（`yph-react-backend` / `yph-react-frontend`），没有目录扫描或参数化。

需要新增：

| job | stage | 内容 | 复用性 |
|-----|-------|------|--------|
| `build-approval` | `build` | `cd approval-server` → `docker build -t .../yph-react-approval:$VERSION` → push | 可复用 `.before_script_template`（[L16-L19](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L16-L19)），其余复制 `build-backend` |
| `deploy-approval-recode` | `deploy-recode` | `curl` Kuboard `updateImageTag`，`name` 改为审批 Deployment 名 | 复制 `deploy-backend-recode`，改 `name` 与镜像名 |

**注意**：现有 CI 没有 `rules`，新 job 默认也会在任意分支 push 时触发；建议给新 job 加 `rules: changes: [approval-server/**]`，避免改前端也重建审批镜像（这是新增的优化，不是现有行为）。

### B. 新增模块后，前端镜像、主后端镜像构建会不会受影响？

**结论：不会。前提是 `approval-server` 放在仓库根目录、与两个现有模块平级。**

依据：

1. **构建上下文隔离**：后端 `docker build ... .` 的 `.` 是 `material-system-server`（[.gitlab-ci.yml](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L32-L39)），前端是 `react-system`（[L58-L65](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L58-L65)）。平级新目录不在上下文内，不会变大。
2. **没有聚合 pom**：`material-system-server/pom.xml` 是单模块，无 `<modules>`，新增目录不需要改父 pom。
3. **Docker 层缓存不失效**：后端先 `COPY pom.xml` 再 `COPY src`（[Dockerfile L11-L15](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/Dockerfile#L11-L15)），前端 `.dockerignore` 排除 `node_modules`/`dist`（[.dockerignore](file:///Users/xiongdongying/ai_project/yph-react/react-system/.dockerignore)），新模块不影响这些层。
4. **唯一间接影响**：如果给 nginx 增加 `/api/approval` 反代，`react-system/nginx.conf` 变化会导致**前端镜像必须重建并发版**（即使 UI 没改）。这是"需要重新发一次前端"，不是"构建受影响"。

**反例（必须避免）**：不要把 `approval-server` 放进 `material-system-server/` 子目录，否则后端构建上下文变大，且容易被误认为同一 Maven 工程。

### C. 部署环节需要新增什么？

**本地 compose（仓库内）**：

| 项 | 内容 |
|----|------|
| 服务 | `approval`（容器名 `material-approval-react`），镜像 `material-approval-react:latest` |
| 端口 | `8082:8082` |
| 网络 | 复用 compose 默认网络；通过服务名访问 `backend:8081`、`material-mysql-react:3306` |
| 环境变量 | `APPROVAL_DB_URL`、`APPROVAL_DB_USERNAME`、`APPROVAL_DB_PASSWORD`、`YPH_JWT_SECRET`、`MAIN_SERVICE_URL=http://backend:8081`、`APPROVAL_SERVICE_TOKEN` |
| 健康检查 | `curl -f http://localhost:8082/api/approval/health`（新增端点） |
| 启动依赖 | `depends_on: mysql(service_started) + backend(service_started)`；**审批服务对主服务只是软依赖**：组织客户端懒加载 + 缓存，主服务不可用时审批服务仍能启动，只是审批人解析失败 |
| 主服务反向依赖 | **无**。主服务不依赖审批服务，避免审批故障拖垮主业务 |

**生产 K8s（仓库内看不到，需运维操作）**：

- 新增 Deployment `yph-react-approval` + Service `yph-react-approval:8082`，镜像由 CI 推送后通过 Kuboard 改 tag。
- 环境变量从 K8s Secret 注入（不要写进 Deployment 明文 YAML 仓库）。
- 就绪探针只检查审批服务自身（`/api/approval/health`），**不要**把主服务健康纳入审批服务的 readiness，否则主服务抖动会导致审批 Pod 被摘除。
- 前端 nginx 增加：

```nginx
location /api/approval/ {
    proxy_pass http://yph-react-approval:8082/api/approval/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 10m;
}
```

- **注意**：`react-system/nginx.conf` 属于运维维护文件，按项目规则 AI **只读不写**，需要运维改并由运维发版（[CLAUDE.md 运维安全规则](file:///Users/xiongdongying/ai_project/yph-react/CLAUDE.md)）。
- nginx 前缀匹配：`/api/approval/` 比 `/api/` 更长，会优先命中，不会与现有反代冲突（[nginx.conf L26-L33](file:///Users/xiongdongying/ai_project/yph-react/react-system/nginx.conf#L26-L33)）。

### D. 数据库：谁建 schema、谁迁移、失败如何不阻断主服务？

**结论：DBA 在生产 MySQL 5.7 实例上一次建 schema；`approval-server` 启动时自己跑 Flyway 7.15（程序化）+ Flowable 自动建表；与主服务迁移链完全分离。**

| 环节 | 执行者 | 时机 | 失败影响 |
|------|--------|------|---------|
| `CREATE DATABASE material_approval` + 授权（生产 MySQL 5.7 实例） | DBA / 运维 | 上线前一次性 | 审批服务无法启动，主服务不受影响 |
| `appr_*` 建表 | `approval-server` 的 Flyway 7.15（`spring.flyway.enabled=false` + 程序化迁移，独立 `flyway_schema_history_approval`） | 审批 Pod 启动时 | 审批 Pod CrashLoop，主服务不受影响 |
| `ACT_*` 建表 | Flowable `database-schema-update=true` | 审批 Pod 首次启动 | 同上 |
| 主库 `nav_menu` V32 菜单数据 | **主服务** Flyway | 主服务发版启动时 | 菜单迁移失败会阻断**主服务**发布，因此必须与审批服务发版解耦、单独验证 |

**关键要求**：

1. **审批迁移脚本绝不能放进 `material-system-server/src/main/resources/db/migration`**：主服务的 Flyway 会把它当自己的版本执行，破坏迁移链。审批脚本只能放 `approval-server/src/main/resources/db/migration/approval`。
2. 主服务与审批服务**各自独立失败**：审批 Pod 起不来只是审批功能不可用，主业务与现有菜单不受影响；反之主服务迁移失败也不会动审批库。
3. **MySQL 5.7 是目标环境**：审批库与主库同实例、独立 schema `material_approval`，**不再要求 8.0 实例**。必须显式锁 `mysql-connector-j:8.3.0`（Boot 3.5.16 默认 9.7.0，9.x 不支持 5.7）与 `flyway-core:7.15.0`（Boot 默认 11.7.2，Flyway 10+ 不支持 5.7；MySQL 支持在 core 内，不引入 `flyway-mysql`）。**Flowable 7.2.0 在 5.7 上尚未实测**（本地仅 MySQL 8.0，5.7 镜像无法拉取），由 T0 兼容性核验确认；失败只影响审批服务，可按备选方案单独部署 8.0 实例。

### E. 回滚：还是"回滚镜像"吗？

**结论：单服务回滚仍是"改镜像 tag"，但整体回滚从 2 步变成 3 步，且出现跨服务契约耦合。**

| 场景 | 是否仍是改 tag | 风险 |
|------|---------------|------|
| 只回滚审批服务 | 是 | 若主服务已发新版 JWT/内部接口，旧审批镜像可能不兼容 |
| 只回滚主服务 | 是 | **危险**：主服务回到旧 Base64 token 后，审批服务仍按 JWT 校验，审批全挂 |
| 整体回滚 | 3 次改 tag（前端/主后端/审批） | 有顺序要求 |

**建议回滚顺序**：先回滚**审批服务**，再回滚主服务，最后回滚前端（菜单隐藏）。原因：审批服务是消费方，先降级消费方不会让主业务不可用。

**数据库与菜单不可自动回滚**：

- Flyway 只前进，审批库新增的表/字段在回滚后仍然存在；因此审批侧迁移必须**向后兼容**（加字段不删字段、不改语义）。
- 主库 V32 菜单数据不会因回滚镜像而删除；回滚后菜单仍指向 `/approval/*`，审批服务不可用时页面 502/白屏。缓解：回滚时同步停用菜单（`nav_menu.status=0`，走 Flyway 新脚本或菜单管理页操作），或前端对审批接口失败做可读降级提示。

### F. JDK 17 / Boot 3.5.16 对 CI 构建镜像的要求，Runner 能否满足？

**结论：不需要新建 JDK 镜像。构建与运行时都复用现有 JDK 17 镜像；Runner 能力仍无法从仓库确认。**

依据：

1. CI 默认镜像是 `base-image-jdk11`（[L5](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L5)），但 job 只跑 `docker build/push/curl`，**不跑 mvn**；Maven 在 Dockerfile 的 `jdk17` 构建阶段执行（[Dockerfile L7-L17](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/Dockerfile#L7-L17)）。所以"CI 镜像是 JDK11"不构成阻塞。
2. 现有后端 Dockerfile 已使用 `base-image:jdk17-gradle8.14-mvn3.9-ci-v1.0.0`（自带 Maven 3.9）与 `openjdk:17-sky8.9`；Boot 3.5.16 / Flowable 7.2.0 的 `jdk.version=17`，**完全匹配，原样复用**。
3. 新模块 Dockerfile 复制现有后端 Dockerfile，构建上下文改为 `approval-server/`，`maven.compiler.release=17`。本机只有 JDK 24，本地构建用 `--release 17`，生产运行仍是 JDK 17。
4. Runner：`tags: oceanet`（[L41-L42](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L41-L42)）。是 shell runner 还是 docker executor、是否挂载 `/var/run/docker.sock`、是否允许拉公网镜像，**仓库内看不到**。

**需要确认/改造**：

- **不需要**制作 JDK 21 镜像，也**不需要**制作 Maven 3.9 新镜像（原结论已作废，2026-11 方案变更）。
- 新 Dockerfile 的 Maven 缓存策略与现有后端一致（`COPY pom.xml` + `dependency:go-offline`），不要引入需要 BuildKit 的 `--mount=type=cache`，因为无法确认 Runner 是否启用 BuildKit。
- 仍需确认 Runner 能否拉取 `registry.zrhsh.com` 内部镜像（现有 job 已在用，推断可用）。

### G. 密钥与配置如何安全注入？

**现状问题**：CI 文件里**明文硬编码**了仓库账号密码与 Kuboard AccessKey（[L43-L45](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L43-L45)、[L84](file:///Users/xiongdongying/ai_project/yph-react/.gitlab-ci.yml#L84)）。这是既有风险，新增模块不应复制这种写法。

**建议（不把密钥写进仓库）**：

| 密钥 | 存放 | 注入方式 |
|------|------|---------|
| 镜像仓库账号 | GitLab CI/CD Variables（Masked + Protected） | job 内 `docker login` 读 `$DOCKER_USERNAME/$DOCKER_PASSWORD` |
| Kuboard AccessKey/Cookie | GitLab CI/CD Variables（Masked + Protected） | `curl` 时引用变量，不写进 YAML |
| `YPH_JWT_SECRET` | K8s Secret（生产）/ 本地 `.env`（开发，gitignore） | Deployment `envFrom.secretRef` |
| 审批库账号密码 | K8s Secret | 同上 |
| `APPROVAL_SERVICE_TOKEN`（内部调用） | K8s Secret，主服务与审批服务**各自注入同一值** | 同上 |
| `MAIN_SERVICE_URL` | ConfigMap / Deployment env | 非敏感，可直接配置 |

**额外建议**：现有的明文凭据应尽快轮换并迁移到 CI 变量；本次评估不执行，只标记风险。

---

## 3. 改动清单与量级

| # | 改动 | 位置 | 是否改现有 job | 量级 |
|---|------|------|---------------|------|
| 1 | 新增 `build-approval` | `.gitlab-ci.yml` | 否 | 小（复制 1 个 job） |
| 2 | 新增 `deploy-approval-recode` | `.gitlab-ci.yml` | 否 | 小（复制 1 个 job + 改 Deployment 名） |
| 3 | 新增 `approval-server/Dockerfile`（复用 JDK 17 构建/运行时基础镜像，不再要求 JDK 21 多阶段） | 新模块 | 否 | 小（复制后端 Dockerfile） |
| 4 | 本地 compose 增加审批服务 | `material-system-server/docker-compose.yml`（或新 compose 文件） | 否（本地文件） | 小 |
| 5 | 前端 nginx 增加 `/api/approval` 反代 | `react-system/nginx.conf`（**运维维护，AI 只读**） | 是（需重新发前端镜像） | 小但需运维配合 |
| 6 | K8s Deployment/Service/Secret/探针 | 生产集群（**仓库外，看不到**） | 否 | 中（运维操作） |
| 7 | 审批库建库与授权（MySQL 5.7 同实例，独立 schema） | 生产 MySQL | 否 | 小（DBA 一次性） |
| 8 | CI 变量配置（仓库、Kuboard、审批密钥） | GitLab 项目设置 | 否 | 小 |

**总量级**：**配置级改造，不需要动现有 4 个 job 的逻辑**；主要工作量在运维侧（K8s 对象、nginx 发版）与 DBA 建库。基础镜像无新增需求。

---

## 4. 上线风险排序（最易出问题 → 最不易）

| 排序 | 风险 | 触发点 | 依据 | 缓解 |
|------|------|--------|------|------|
| 1 | **Flyway 7.15 与 Boot 3.5 自动配置不兼容** | 审批 Pod 启动报 `NoSuchMethodError` | 已实测：`FluentConfiguration.placeholderSeparator(String)` | `spring.flyway.enabled=false` + `ManualFlywayConfig` 用 Flyway 7.15 Java API 程序化迁移；镜像内加启动冒烟与 `flyway_schema_history_approval` 校验 |
| 2 | **Flowable 7.2.0 在 MySQL 5.7 上未实测** | 启动或建表阶段报 SQL / 驱动认证错误 | 本地仅 MySQL 8.0，5.7 镜像无法拉取 | T0 兼容性核验；失败保留原始报错并升级决策（备选：审批单独部署 8.0 实例） |
| 3 | **K8s 对象与 nginx 路由未就绪** | 前端 502 / 审批接口 404 | 生产 manifest 不在仓库，nginx.conf 由运维维护 | 运维提前建 Deployment/Service/Secret 并灰度验证 |
| 4 | **跨服务 JWT 契约回滚耦合** | 只回滚一端导致审批全挂 | 主服务签发、审批服务校验，共享密钥 | 规定回滚顺序；JWT 变更做双读兼容期 |
| 5 | **菜单指向不可用服务** | 回滚审批服务后菜单仍在 | V32 菜单在主库，Flyway 不回滚 | 回滚预案包含停用菜单脚本；前端接口失败可读降级 |
| 6 | **审批库迁移不可回滚** | 回滚镜像后新表新字段仍在 | Flyway 只前进 | 迁移只加不删；发版前备份 `material_approval` |
| 7 | **构建上下文/Cache 受影响** | 现有镜像构建变慢 | 上下文隔离、无聚合 pom | 保持模块平级即可规避（最低风险） |
| 8 | **EOL 无官方补丁（长期风险）** | 出现新 CVE 无官方修复版本 | Boot 3.5 OSS 支持已结束、Flowable 7.x 无维护分支 | 内部补丁流程 + 月度依赖 SCA + 商业支持评估 + 内网最小暴露 + 升级预案；责任方见规划第 6 节 |

---

## 5. 是否建议先加"只构建不部署"的灰度 job？

**建议，且优先做。** 具体做法：

1. 先只加 `build-approval`，加 `rules: changes: [approval-server/**]`，在 feature 分支跑通"镜像能构建、能推送"。
2. 手工用该镜像在本地 compose 或测试 K8s 启动，验证：Flyway 能连库建表、Flowable 能初始化、`/api/approval/health` 返回 UP。
3. 验证通过后，再加 `deploy-approval-recode`（`when: manual`），并把 Deployment 名、Secret 名与运维对齐。
4. 最后才让前端 nginx 增加 `/api/approval` 并发版；在 nginx 未更新前，审批接口只能内网直连验证，不影响现有用户。

这样可以把"构建失败""启动失败""路由失败"三类问题分阶段暴露，避免一次性上线时无法定位。

---

## 6. 仓库内看不到、不能当作事实的信息

| 项 | 状态 |
|----|------|
| GitLab Runner 的 executor 类型、是否 dind、是否挂载宿主 Docker socket、是否允许公网拉镜像 | 看不到（只能看到 tag `oceanet`） |
| 生产 K8s 的 Deployment/Service/Ingress/探针/资源 limits、副本数 | 看不到（仓库无 manifest，只有 Kuboard API 调用） |
| 生产实际使用的 nginx 配置是否与仓库 `react-system/nginx.conf` 一致 | 看不到 |
| 私有 registry 是否已有 MySQL 5.7 镜像（用于 T0 兼容性实测） | 看不到（本地只有 8.0，5.7 镜像无法拉取） |
| 生产 MySQL 实际版本（预期 5.7）与建库、授权权限 | 看不到（需 T0 核验） |
| 生产是否启用 BuildKit / 是否允许 Docker layer cache 复用 | 看不到 |
