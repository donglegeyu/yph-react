# 逸品汇中台系统（yph-react）运维操作手册

> **适用对象**：运维人员 / 部署工程师
> **文档用途**：从 git 拉取代码后，按本手册操作即可完成服务器部署、日常运维、故障排查
> **Last updated**: 2026-06-18（v3：数据库变更改为 Flyway 自动增量执行，无需运维手动跑 SQL）

---

## 一、项目概述

### 1.1 系统组成

| 组件 | 技术栈 | 端口（容器内） | 说明 |
|------|--------|--------------|------|
| 前端 | React 19 + TypeScript + Vite + Ant Design 6 | 80（Nginx） | 静态资源，由 Nginx 托管 |
| 后端 | Spring Boot 3.2.5 + MyBatis-Plus + Java 17 | 8081 | REST API 服务 |
| 数据库 | MySQL 8.0 | 3306 | 业务数据存储 |

### 1.2 目录结构

```
yph-react/                          ← git 仓库根目录
├── react-system/                   ← 前端源码
│   ├── src/
│   ├── dist/                       ← 构建产物（npm run build 后生成）
│   ├── nginx.conf                  ← 前端 Nginx 配置（生产环境）
│   ├── Dockerfile                  ← 前端镜像构建（多阶段：node 构建 + nginx 托管）
│   └── package.json
├── material-system-server/         ← 后端源码 + 部署配置
│   ├── src/main/resources/db/migration/  ← Flyway 增量 SQL（V2__xxx.sql, V3__xxx.sql...）
│   ├── init/                       ← 数据库初始化 SQL（仅 MySQL 首次启动时执行）
│   ├── docker-compose.yml          ← 容器编排（MySQL + 后端）
│   ├── Dockerfile                  ← 后端镜像构建（多阶段：Maven 构建 + JRE 运行）
│   ├── restart-safe.sh             ← 安全重启后端脚本
│   ├── backup.sh                   ← 数据库备份脚本
│   ├── restore.sh                  ← 数据库恢复脚本
│   └── pom.xml
└── docs/部署运行/                   ← 项目文档
```

### 1.3 端口规划

| 服务 | 服务器端口 | 容器内端口 | 备注 |
|------|----------|----------|------|
| 前端（Nginx） | 80 或 3001 | 80 | 对外暴露 |
| 后端 API | 8081 | 8081 | 建议仅内网或经 Nginx 代理 |
| MySQL | 3307（可不映射） | 3306 | **生产环境建议不对外暴露端口** |

---

## 二、环境要求

### 2.1 服务器配置建议

| 资源 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4 GB | 8 GB+ |
| 磁盘 | 40 GB | 100 GB+（SSD） |
| 操作系统 | CentOS 7+ / Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### 2.2 必须安装的软件

```bash
# 1. Docker Engine（必须）
docker --version          # 要求 24.0+
docker compose version    # 要求 v2.20+

# 2. Git（拉取代码）
git --version

# 3. Node.js（前端构建用，可在本地构建后上传 dist）
node --version            # 要求 18+，推荐 20+
npm --version

# 4.（可选）Java 17 + Maven（如需在服务器本地构建后端 jar）
java -version
mvn -version
```

### 2.3 Docker 安装（如服务器未安装）

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker

# 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER
# 重新登录后生效

# 验证
docker run hello-world
```

---

## 三、首次部署流程（完整步骤）

### 3.1 第 1 步：拉取代码

```bash
cd /opt    # 或你选择的部署目录
git clone <仓库地址> yph-react
cd yph-react
```

> 如果是私有仓库，需先配置 SSH key 或使用带 token 的 HTTPS 地址。

### 3.2 第 2 步：部署后端 + MySQL（Docker）

```bash
cd material-system-server

# 1. 创建 MySQL 数据卷（持久化存储）
docker volume create material-mysql-react-data

# 2. 构建后端镜像
docker build -t material-backend-react:latest .

# 3. 启动 MySQL + 后端
docker compose up -d
```

**验证后端启动**：

```bash
# 等待 30 秒后检查
sleep 30

# 健康检查（应返回 JSON 格式的菜单数据）
curl -s http://localhost:8081/api/nav-menus | head -c 200

# 查看容器状态
docker ps | grep material
# 预期看到 2 个容器：
#   material-mysql-react    (healthy/up)
#   material-backend-react  (healthy/up)
```

**验证数据库初始化**：

```bash
# 检查菜单数据是否完整（预期 56 条）
docker exec -i material-mysql-react mysql -uroot -proot123456 -N -e \
  "SELECT COUNT(*) FROM material_system_react.sys_domain_menu WHERE domain_id=1;"

# 检查 Flyway 基线是否已建立
docker exec -i material-mysql-react mysql -uroot -proot123456 -N -e \
  "SELECT version, description FROM material_system_react.flyway_schema_history ORDER BY version;"
```

> 数据库结构初始化（`init/` 目录）只在 MySQL 容器**首次启动**时执行。后续变更通过 Flyway 增量脚本自动执行，详见 4.4 节。

### 3.3 第 3 步：构建并部署前端

仓库已内置生产环境部署文件：

| 文件 | 路径 | 作用 |
|------|------|------|
| Nginx 配置 | [react-system/nginx.conf](../../react-system/nginx.conf) | 静态资源托管 + API 反向代理 + gzip 压缩 + 缓存策略 + 安全头 |
| Dockerfile | [react-system/Dockerfile](../../react-system/Dockerfile) | 多阶段构建（node 构建 dist → nginx 托管） |
| dockerignore | [react-system/.dockerignore](../../react-system/.dockerignore) | 排除 node_modules/dist/.git 等 |

> Nginx 反向代理把 `/api/`、`/uploads/` 转发到后端容器 `material-backend-react:8081`，与开发模式的 [vite.config.ts](../../react-system/vite.config.ts) 代理规则保持一致。

#### 方式 A：在服务器上构建 Docker 镜像（推荐）

```bash
cd /opt/yph-react/react-system

# 构建前端镜像（Dockerfile 会自动 npm install + npm run build）
docker build -t material-frontend-react:latest .

# 启动前端容器（与后端在同一 Docker 网络）
docker run -d \
  --name material-frontend-react \
  --network material-system-server_default \
  -p 80:80 \
  --restart unless-stopped \
  material-frontend-react:latest
```

> **网络说明**：后端的 docker-compose 会创建名为 `material-system-server_default` 的 Docker 网络。前端容器必须加入该网络，才能通过容器名 `material-backend-react` 访问后端。

#### 方式 B：本地构建后上传 dist（服务器无 Node.js 时）

```bash
# 在本地开发机执行
cd react-system
npm install && npm run build

# 上传 dist 到服务器
scp -r dist/ user@server:/opt/yph-react/react-system/

# 服务器上用 Nginx 托管（手动安装 nginx 或用 docker nginx）
```

### 3.4 第 4 步：最终验证

```bash
# 1. 检查所有容器
docker ps | grep material
# 预期 3 个容器：mysql、backend、frontend

# 2. 访问前端
curl -s http://localhost | head -c 100
# 或浏览器打开 http://<服务器IP>

# 3. 验证 API 通畅（通过 Nginx 代理）
curl -s http://localhost/api/nav-menus | head -c 200

# 4. 验证后端直连
curl -s http://localhost:8081/api/nav-menus | head -c 200
```

### 3.5 默认账号与初始化数据

全新部署后，系统自动初始化以下数据（无需手动配置）：

#### 内置账号

| 用户名 | 密码 | 昵称 | 角色 | 所属域 | 说明 |
|--------|------|------|------|--------|------|
| `admin` | `admin123` | 管理员 | 超级管理员 | 星际造梦 + 工匠平台 | **首次登录后务必修改密码** |
| `craftsman` | `123123` | 工匠演示 | 研发人员 | 星际造梦 + 工匠平台 | 演示账号，生产环境可删除 |

> 定义见 [init/10-init-system-data.sql](../../material-system-server/init/10-init-system-data.sql)

#### 域（2 个）

| 域标识 | 域名称 | 说明 |
|--------|--------|------|
| `xingjiZM` | 星际造梦 | 默认域，拥有全部菜单 |
| `gongjiangPT` | 工匠平台 | 自定义域，仅工单/工匠相关菜单（26 条） |

#### 部门（6 个）

```
壹品慧公司(yph_hq)
├── 研发部(yph_rd)
├── 销售部(yph_sales)
│   ├── 华东销售组(yph_sales_east)
│   └── 华北销售组(yph_sales_north)
└── 财务部(yph_finance)
```

#### 角色（5 个）

| 角色 | 编码 | 数据范围 | 菜单权限 |
|------|------|---------|---------|
| 超级管理员 | ROLE_ADMIN | 全部数据 | 全部菜单（自动授予） |
| 研发人员 | ROLE_DEV | 本部门 | 40 条（业务+工匠，不含系统管理） |
| 销售专员 | ROLE_SALES | 本部门 | 需手动配置 |
| 销售主管 | ROLE_SALES_LEADER | 本部门及以下 | 需手动配置 |
| 财务专员 | ROLE_FINANCE | 仅本人 | 需手动配置 |

> 部门和角色定义见 [init/15-rbac.sql](../../material-system-server/init/15-rbac.sql)

#### 验证初始化数据完整性

```bash
# 验证内置账号（预期 2 个：admin + craftsman）
docker exec -i material-mysql-react mysql -uroot -proot123456 -N -e \
  "SELECT username FROM material_system_react.sys_user;"

# 验证域（预期 2 个）
docker exec -i material-mysql-react mysql -uroot -proot123456 -N -e \
  "SELECT domain_key, domain_name FROM material_system_react.sys_domain;"

# 验证默认域菜单数量（预期 56 条）
docker exec -i material-mysql-react mysql -uroot -proot123456 -N -e \
  "SELECT COUNT(*) FROM material_system_react.sys_domain_menu WHERE domain_id=1;"

# 验证工匠平台域菜单数量（预期 26 条）
docker exec -i material-mysql-react mysql -uroot -proot123456 -N -e \
  "SELECT COUNT(*) FROM material_system_react.sys_domain_menu WHERE domain_id=2;"

# 验证研发角色菜单权限（预期 40 条）
docker exec -i material-mysql-react mysql -uroot -proot123456 -N -e \
  "SELECT COUNT(*) FROM material_system_react.sys_role_menu WHERE role_id=2;"
```

---

## 四、日常运维操作

### 4.1 服务管理命令速查

```bash
cd /opt/yph-react/material-system-server

# === 启动 / 停止 ===
docker compose up -d                    # 启动 MySQL + 后端
docker compose down                     # 停止（保留数据）
docker compose down -v                  # 停止 + 删除数据卷（⚠️ 数据全丢）
docker compose restart                  # 原地重启
docker compose restart backend          # 只重启后端

# === 前端容器 ===
docker start material-frontend-react    # 启动
docker stop material-frontend-react     # 停止
docker restart material-frontend-react  # 重启

# === 安全重建后端（推荐方式） ===
./restart-safe.sh
# 等价于：
# docker build -t material-backend-react:latest .
# docker stop material-backend-react && docker rm material-backend-react
# docker compose up -d backend

# === 查看日志 ===
docker logs -f material-backend-react           # 后端实时日志
docker logs -f material-backend-react --tail 100 # 最近 100 行
docker logs -f material-mysql-react             # MySQL 日志
docker logs -f material-frontend-react          # Nginx 日志

# === 进入容器 ===
docker exec -it material-backend-react sh       # 进入后端
docker exec -it material-mysql-react mysql -uroot -proot123456  # 进入 MySQL
docker exec -it material-frontend-react sh      # 进入前端 Nginx
```

### 4.2 代码更新部署流程

当 git 仓库有新代码需要更新到服务器时：

```bash
cd /opt/yph-react

# 1. 拉取最新代码
git pull origin main

# 2. 判断需要更新什么
#    - 前端代码变更 → 重建前端镜像
#    - 后端代码变更 → 重建后端镜像（数据库 SQL 变更也一样）
#    - 数据库 SQL 变更 → 后端启动时 Flyway 自动识别并执行 db/migration/ 下的新脚本，无需运维手动执行
```

#### 更新前端

```bash
cd /opt/yph-react/react-system
git pull
docker build -t material-frontend-react:latest .
docker stop material-frontend-react && docker rm material-frontend-react
docker run -d \
  --name material-frontend-react \
  --network material-system-server_default \
  -p 80:80 \
  --restart unless-stopped \
  material-frontend-react:latest
```

#### 更新后端

```bash
cd /opt/yph-react/material-system-server
git pull
./restart-safe.sh    # 脚本会自动构建镜像 + 安全重启 + 健康检查
```

### 4.3 数据库备份与恢复

#### 手动备份

```bash
cd /opt/yph-react/material-system-server
./backup.sh
# 备份文件保存在 backups/ 目录，自动 gzip 压缩
# 保留最近 10 份，自动清理旧备份
```

#### 自动备份（推荐配置 crontab）

```bash
# 编辑定时任务
crontab -e

# 每天凌晨 2 点自动备份
0 2 * * * cd /opt/yph-react/material-system-server && ./backup.sh >> backups/cron.log 2>&1

# 保存退出后会自动生效
```

#### 恢复备份

```bash
cd /opt/yph-react/material-system-server

# 查看可用备份
ls -1t backups/*.sql.gz | head -10

# 恢复最新备份
./restore.sh latest

# 恢复指定备份
./restore.sh backups/material_system_react_20260617_020000.sql.gz
```

> ⚠️ 恢复操作会**覆盖现有全部数据**，脚本会要求输入 `yes` 确认。

### 4.4 数据库增量更新（Flyway 自动执行，运维无需手动操作）

**关键变更**：从 v3 起，数据库变更不再需要运维手动连接 MySQL 执行 SQL。后端启动时 **Flyway** 会自动识别 `src/main/resources/db/migration/` 下的新脚本并按版本号顺序执行。

#### 工作原理

| 概念 | 说明 |
|------|------|
| **Baseline（基线）** | 当前数据库结构被标记为版本 0（`<< Flyway Baseline >>`），后续从 V1 开始递增 |
| **版本表** | `flyway_schema_history` 表记录每个脚本的执行状态，已成功执行过的脚本不会重复执行 |
| **脚本命名** | `V{版本号}__{描述}.sql`（注意是**两个下划线**），如 `V2__add_skill_table.sql` |
| **幂等要求** | 每个脚本必须可重复执行不出错（用 `IF NOT EXISTS`、`WHERE NOT EXISTS` 等写法） |

#### 运维只需做 3 件事

```bash
# 1. 拉取最新代码（开发同学会把新增的 Vxx__xxx.sql 放到 db/migration/ 目录下）
cd /opt/yph-react
git pull origin main

# 2. 重建后端镜像并重启（Flyway 在后端启动时自动执行新脚本）
cd material-system-server
./restart-safe.sh

# 3. 验证（可选）
docker exec -i material-mysql-react mysql -uroot -proot123456 material_system_react -e \
  "SELECT version, description, success FROM flyway_schema_history ORDER BY version;"
```

#### Flyway 执行日志（在后端日志中）

```bash
docker logs material-backend-react --tail 50 | grep -i flyway
# 成功时会看到类似：
#   Creating Schema History table `material_system_react`.`flyway_schema_history` ...
#   Migrating schema `material_system_react` to version "1 - baseline"
#   Migrating schema `material_system_react` to version "2 - xxx"
#   Successfully applied 2 migrations ...
```

#### 重要规则（给开发同学看，但运维需要了解）

- ❌ **脚本一旦提交并执行过，就不能修改内容**（Flyway 会校验 checksum，修改后会报错）
- ✅ 要改就新建一个更高版本号的脚本（如 V3、V4...）
- ✅ 文件名版本号必须全局唯一，且递增（不能回头用已用过的版本号）
- ✅ 脚本必须幂等（重复执行不出错）

#### 验证当前数据库版本

```bash
docker exec -i material-mysql-react mysql -uroot -proot123456 material_system_react -e \
  "SELECT version, description, script, success FROM flyway_schema_history ORDER BY version;"
```

预期输出（当前基线状态）：

```
+---------+------------------------+-------------------------+---------+
| version | description            | script                  | success |
+---------+------------------------+-------------------------+---------+
| 0       | << Flyway Baseline >>  | << Flyway Baseline >>   |       1 |
| 1       | baseline               | V1__baseline.sql        |       1 |
| 2       | example template       | V2__example_template.sql|       1 |
+---------+------------------------+-------------------------+---------+
```

> 如发现 `success=0` 的记录，说明某脚本执行失败，需检查脚本内容和后端日志。

---

## 五、运维红线（务必遵守）

### 🔴 红线 1：不要在已有容器运行时执行全量 `docker compose up -d`

**事故案例**：`docker compose up -d` 在容器名冲突时不会报错，而是自动创建**第二个 MySQL 容器**（空库），导致后端连接到空数据库，业务数据"丢失"。

```bash
# ❌ 绝对禁止（已有容器运行时）
docker compose up -d

# ✅ 正确：只重建后端
docker stop material-backend-react && docker rm material-backend-react
docker compose up -d backend

# ✅ 或直接用安全脚本
./restart-safe.sh
```

**每次容器操作前，强制检查**：

```bash
docker ps --format '{{.Names}} {{.Image}}' | grep mysql
# 预期：只有一行 material-mysql-react
```

### 🔴 红线 2：`docker compose down -v` 会清空全部数据

`-v` 参数会删除数据卷，包括所有数据库数据、用户配置、手动添加的菜单。**执行前必须备份**。

### 🔴 红线 3：操作数据库前先确认连接的是哪个容器

```bash
# 确认后端连接的数据库地址
docker exec material-backend-react env | grep SPRING_DATASOURCE_URL
# 输出中的 host 应该是 material-mysql-react
```

### 🔴 红线 4：生产环境不要对外暴露 MySQL 端口

建议修改 `docker-compose.yml`，删除或注释 MySQL 的端口映射：

```yaml
services:
  mysql:
    # ports:
    #   - "3307:3306"    # ← 生产环境注释掉，仅容器内访问
```

### 🔴 红线 5：修改密码

默认数据库密码 `root123456` 和 admin 账号密码 `admin123` **必须修改**。

---

## 六、故障排查指南

### 6.1 排错速查表

| 现象 | 排查步骤 |
|------|---------|
| 前端白屏 | ① 检查前端容器是否运行 `docker ps \| grep frontend` ② 检查 Nginx 日志 `docker logs material-frontend-react` ③ 检查后端是否通 `curl http://localhost:8081/api/nav-menus` |
| 页面显示但接口 404 | Nginx 反向代理配置错误，检查 `/api/` 是否正确代理到后端 |
| 接口 500 | 查看后端日志 `docker logs material-frontend-react` |
| 菜单不全 | 数据库初始化不完整，见 6.3 节 |
| 后端连不上数据库 | 检查是否有双 MySQL 容器，见 6.2 节 |
| 上传文件失败 | 检查 Nginx `client_max_body_size` 和后端 `multipart.max-file-size` |
| 容器频繁重启 | `docker logs <容器名>` 查看启动失败原因 |
| Flyway 迁移失败（后端启动失败或报 checksum 错误） | 见下方 6.6 节 |

### 6.2 双 MySQL 容器事故处理

如果发现 MySQL 容器异常：

```bash
# 1. 列出所有 MySQL 容器
docker ps --format '{{.Names}} {{.Image}} {{.Status}}' | grep mysql

# 2. 如发现多个，确认后端连的是哪个
docker exec material-backend-react env | grep SPRING_DATASOURCE_URL

# 3. 确认哪个容器有业务数据
docker exec -i <容器名> mysql -uroot -proot123456 -e \
  "SELECT COUNT(*) FROM material_system_react.nav_menu;"
# 有数据的那个 COUNT 应该 > 0

# 4. 停掉空的那个
docker stop <空容器名>
docker rm <空容器名>
```

### 6.3 菜单数据不完整

```bash
# 检查默认域菜单数量（预期 56）
docker exec -i material-mysql-react mysql -uroot -proot123456 -N -e \
  "SELECT COUNT(*) FROM material_system_react.sys_domain_menu WHERE domain_id=1;"

# 如果数量不对，重建数据库（⚠️ 会清空数据，先备份！）
cd /opt/yph-react/material-system-server
./backup.sh
docker compose down -v
docker compose up -d
```

### 6.4 磁盘空间不足

```bash
# 检查磁盘
df -h

# 清理 Docker 无用镜像/容器/缓存
docker system prune -a    # ⚠️ 会删除未使用的镜像，确认后执行

# 清理旧备份（保留最近 10 份，backup.sh 会自动清理）
ls -la /opt/yph-react/material-system-server/backups/

# 检查 Docker 数据卷大小
docker system df
```

### 6.5 后端启动超时

```bash
# 查看启动日志
docker logs material-backend-react --tail 200

# 常见原因：
# 1. MySQL 未就绪 → 检查 docker ps，等待 MySQL healthy
# 2. 数据库连接失败 → 检查 SPRING_DATASOURCE_URL
# 3. 端口被占用 → netstat -tlnp | grep 8081
```

### 6.6 Flyway 迁移失败排查

Flyway 执行失败会导致后端容器启动失败或无法正常运行。常见场景：

#### 场景 A：checksum 校验失败（日志中含 `checksum mismatch`）

**原因**：已执行过的 SQL 脚本被修改了内容（违反脚本不可变原则）。

```bash
# 查看后端日志中的 Flyway 错误
docker logs material-backend-react --tail 100 | grep -i -A5 'flyway\|checksum\|migration'

# 查看 flyway_schema_history 表确认哪个版本出问题
docker exec -i material-mysql-react mysql -uroot -proot123456 material_system_react -e \
  "SELECT version, script, success, checksum FROM flyway_schema_history ORDER BY version;"
```

**处理**：通知开发同学，**不要修改已执行的脚本**，应新建更高版本的脚本。如确需修复：
1. 先备份数据库 `./backup.sh`
2. 由开发同学评估影响，再决定是回滚还是用新脚本修复

#### 场景 B：新脚本执行失败（SQL 语法错误或表/字段已存在）

**原因**：新的 Vxx__xxx.sql 中有语法错误或缺少幂等判断。

```bash
# 查看后端日志中 Flyway 的详细报错
docker logs material-backend-react --tail 200 | grep -i -B2 -A10 'flyway\|error\|exception'

# 标记失败脚本：success=0 的那条就是出问题的版本
docker exec -i material-mysql-react mysql -uroot -proot123456 material_system_react -e \
  "SELECT version, script, success FROM flyway_schema_history WHERE success=0;"
```

**处理**：由开发同学修复脚本内容 → 运维重新 `./restart-safe.sh`。

#### 场景 C：全新环境部署后 flyway_schema_history 不存在

**原因**：新部署的 MySQL 未执行基线。Flyway 的 `baseline-on-migrate: true` 配置会**自动**建立基线（版本 0），无需运维干预。如遇异常：

```bash
# 检查是否已有基线
docker exec -i material-mysql-react mysql -uroot -proot123456 material_system_react -e \
  "SELECT COUNT(*) FROM flyway_schema_history;"
# 预期 >= 1（至少有版本 0 的基线记录）

# 若为空表，重启后端触发 Flyway 重新初始化
docker compose restart backend
```

---

## 七、数据卷与持久化

### 7.1 数据卷说明

| 数据卷 | 挂载点 | 内容 | 重要性 |
|--------|--------|------|--------|
| `material-mysql-react-data` | `/var/lib/mysql` | 数据库所有数据 | ⚠️ 最高 |
| `material-uploads-react-data` | `/app/uploads` | 用户上传的文件 | ⚠️ 高 |

### 7.2 数据卷备份（迁移服务器时）

```bash
# 1. 备份数据库
cd /opt/yph-react/material-system-server
./backup.sh

# 2. 备份上传文件
docker run --rm -v material-uploads-react-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads_backup.tar.gz -C /data .

# 3. 将 backups/*.sql.gz 和 uploads_backup.tar.gz 一起迁移
```

### 7.3 数据卷恢复（新服务器）

```bash
cd /opt/yph-react/material-system-server

# 1. 正常部署启动（见第三章）
docker compose up -d

# 2. 恢复数据库
./restore.sh backups/xxx.sql.gz

# 3. 恢复上传文件
docker run --rm -v material-uploads-react-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/uploads_backup.tar.gz -C /data

# 4. 重启后端
docker compose restart backend
```

---

## 八、安全加固建议

### 8.1 修改默认密码

```bash
# 1. 修改 MySQL root 密码
docker exec -it material-mysql-react mysql -uroot -proot123456 -e \
  "ALTER USER 'root'@'%' IDENTIFIED BY '你的新密码';"

# 2. 同步修改 docker-compose.yml 和 application.yml 中的密码
#    - material-system-server/docker-compose.yml（如配置了 MYSQL_ROOT_PASSWORD）
#    - material-system-server/src/main/resources/application.yml（spring.datasource.password）

# 3. 重建后端使配置生效
./restart-safe.sh
```

### 8.2 配置 HTTPS（推荐）

在前端 Nginx 配置中增加 SSL：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... 其余配置同 http
}

# http 跳转 https
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

### 8.3 防火墙配置

```bash
# 仅开放必要端口
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 443/tcp      # HTTPS（如启用）
sudo ufw allow 22/tcp       # SSH
# 不要开放 3306/3307（MySQL）和 8081（后端，走 Nginx 代理）
sudo ufw enable
```

---

## 九、附录

### 9.1 数据库初始化 SQL 说明

`init/` 目录下的 SQL 在 MySQL 首次启动时按文件名顺序自动执行：

| 顺序 | 文件 | 内容 |
|------|------|------|
| 01 | 01-schema-correct.sql | 核心表结构 |
| 02 | 02-sys-permission.sql | 权限系统表 + 默认域（星际造梦） |
| 03 | 03-favorite.sql | 收藏表 |
| 04 | 04-user-preference.sql | 用户偏好表 |
| 05 | 05-icon-config.sql | 图标配置表 |
| 06 | 06-construction-application.sql | 施工申请表 |
| 07 | 07-material-view.sql | 材料视图表 |
| 08 | 08-menu-view.sql | 菜单视图表 |
| 09 | 09-init-data.sql | 材料申请测试数据 |
| 09 | 09-menu-seed.sql | **菜单种子数据（56 条） + 工匠平台域（26 条关联）** |
| 10 | 10-craftsman.sql | 工匠表 |
| 10 | 10-init-system-data.sql | **admin + craftsman 账号 + 域关联** |
| 11 | 11-init-design-tokens.sql | 设计令牌 |
| 13 | 13-tag.sql | 标签表 |
| 14 | 14-security-check.sql | 安检表 |
| 15 | 15-rbac.sql | **RBAC 权限（6 部门 + 5 角色 + 研发菜单权限 + 账号角色绑定）** |
| 16 | 16-skill.sql | 技能表 |
| 17 | 17-certificate-image.sql | 证书图片表 |

> 全新部署后开箱即用的数据：2 账号、2 域、6 部门、5 角色、56 菜单。详见第 3.5 节。

详见 [init/README.md](../../material-system-server/init/README.md)。

### 9.2 关键连接信息

| 项 | 值 |
|----|-----|
| 数据库名 | `material_system_react` |
| 数据库用户 | `root` |
| 数据库密码 | `root123456`（**生产环境务必修改**） |
| 后端 API 基础路径 | `/api` |
| 文件上传路径 | `/app/uploads` |
| 文件访问 URL 前缀 | `/uploads` |

### 9.3 相关文档索引

| 文档 | 路径 | 用途 |
|------|------|------|
| 项目入口 | [CLAUDE.md](../../CLAUDE.md) | 技术栈、模块、命令速查 |
| 运行指南 | [docs/部署运行/RUNBOOK.md](./RUNBOOK.md) | 开发环境快速启动 |
| 运维规范 | [.trae/rules.d/ops-rules.md](../../.trae/rules.d/ops-rules.md) | 容器操作红线 |
| 初始化 SQL 说明 | [material-system-server/init/README.md](../../material-system-server/init/README.md) | SQL 执行顺序 |

### 9.4 紧急联系

| 场景 | 处理方式 |
|------|---------|
| 数据丢失 | 立即停止所有写入 → 从 `backups/` 恢复最新备份 |
| 服务不可用 | `docker ps` 检查容器 → `docker logs` 查看错误 → 重启对应容器 |
| 安全事件 | 关闭对外端口 → 修改密码 → 检查日志 → 通知负责人 |
