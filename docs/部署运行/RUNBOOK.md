# yph-react 项目运行指南

> 给接手本项目的同事：按本文档操作，可以一次跑通前后端，并看到完整菜单。
> Last updated: 2026-06-16

---

## 一、环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18 | 推荐 20+ |
| Docker Desktop | 最新 | 必须能跑 `docker compose` |
| Java | 17 | 仅本地直接跑后端时需要；用 Docker 跑后端则不需要 |
| Maven | 3.9+ | 仅本地直接跑后端时需要 |

---

## 二、项目结构

```
yph-react/
├── react-system/              ← 前端（React 19 + Vite，端口 3001）
├── material-system-server/    ← 后端（Spring Boot，端口 8081）
│   ├── docker-compose.yml     ← 一键启动 MySQL + 后端
│   ├── init/                  ← 数据库初始化 SQL（首次启动自动执行）
│   ├── restart-safe.sh        ← 安全重启后端脚本
│   ├── backup.sh / restore.sh ← 数据库备份/恢复
│   └── Dockerfile
└── docs/                      ← 项目文档
```

---

## 三、快速启动（推荐：Docker 跑后端 + 本地跑前端）

### 第 1 步：启动后端 + MySQL（Docker）

```bash
cd material-system-server

# 首次启动：创建数据卷 + 构建后端镜像 + 启动 MySQL + 后端
docker volume create material-mysql-react-data
docker build -t material-backend-react:latest .
docker compose up -d
```

> 首次启动时，MySQL 容器会自动执行 `init/` 目录下按文件名排序的所有 SQL（01~15），创建表结构和初始数据。

验证后端是否就绪：

```bash
# 健康检查：应该返回菜单 JSON
curl -s 'http://localhost:8081/api/nav-menus' | head -c 200
```

### 第 2 步：启动前端

```bash
cd ../react-system
npm install        # 首次需要安装依赖
npx vite --host 0.0.0.0 --port 3001
```

浏览器打开：http://localhost:3001

---

## 四、菜单管理（已重构）

### 菜单数据从哪来

所有菜单种子数据集中在 **[init/09-menu-seed.sql](file:///material-system-server/init/09-menu-seed.sql)** 一个文件里，它是 `nav_menu` 表的**唯一数据来源**。该文件末尾会自动把所有菜单同步到默认域 `sys_domain_menu`，所以全新部署就能拿到完整菜单（56 条）。

> 历史上菜单 INSERT 散落在 01/06/09.5/12/16 五个文件里，且各自只管插 `nav_menu`、不同步默认域，导致全新部署默认域菜单不全。现已全部收敛到 09。

### 新增/修改菜单怎么改

只改 [09-menu-seed.sql](file:///material-system-server/init/09-menu-seed.sql) 这一个文件。改完后：
- **新环境**：`docker compose down -v && docker compose up -d` 重建即可生效
- **已运行环境**：要么在「菜单管理」页面手动加，要么重建数据卷

### 如果同事菜单不全（旧版本跑出来的）

让同事拉最新代码后，二选一：

**方案 A（彻底重建，推荐）：**

```bash
cd material-system-server
docker compose down -v                    # 删除数据卷
docker compose up -d                       # 重新初始化
```

**方案 B（保留现有数据，手动补）：**

由于 09 的 INSERT 不是幂等的（用多 VALUES 而非 WHERE NOT EXISTS），对已有数据的旧库直接灌会报主键冲突。旧环境补菜单请走「菜单管理」页面，或备份后重建。

### 如何验证菜单完整

```bash
docker exec -i material-mysql-react mysql -uroot -proot123456 -N -e \
  "SELECT COUNT(*) FROM material_system_react.sys_domain_menu WHERE domain_id=1;"
# 预期：56
```

---

## 五、常见命令速查

```bash
# === 后端 ===
cd material-system-server

./restart-safe.sh                          # 安全重建后端（推荐）
docker compose up -d                       # 启动 MySQL + 后端
docker compose down                        # 停止（保留数据）
docker compose down -v                     # 停止 + 删数据卷（数据全丢）
./backup.sh                                # 备份数据库
./restore.sh                               # 恢复数据库

# === 前端 ===
cd react-system
npm install
npx vite --host 0.0.0.0 --port 3001
npm run build                              # 生产构建（会先跑 tsc 类型检查）

# === 数据库 ===
docker exec -it material-mysql-react mysql -uroot -proot123456 material_system_react

# === 检查容器 ===
docker ps | grep material-mysql-react      # 预期 1 个 MySQL 容器
docker ps | grep material-backend-react    # 预期 1 个后端容器
```

---

## 六、端口与连接信息

| 服务 | 端口 | 地址 |
|------|------|------|
| 前端 | 3001 | http://localhost:3001 |
| 后端 | 8081 | http://localhost:8081 |
| MySQL | 3307（宿主机）→ 3306（容器） | root / root123456 |
| 数据库名 | - | material_system_react |

前端通过 Vite 代理把 `/api` 转发到 `http://localhost:8081`（见 `react-system/vite.config.ts`）。

---

## 七、运维红线（务必遵守）

1. **不要在已有容器运行时执行 `docker compose up -d`（全量）**，可能产生两个 MySQL 容器，后端连到空库。只重建后端：

   ```bash
   docker stop material-backend-react && docker rm material-backend-react
   docker compose up -d backend
   ```

2. **`docker compose down -v` 会清空所有数据**，包括手动配置的菜单、用户。执行前三思。

3. **init SQL 只在首次启动执行**。之后要改数据，用 `docker exec ... mysql` 手动灌，或走后端 API。

---

## 八、排错清单

| 现象 | 排查 |
|------|------|
| 前端打开白屏 | 后端是否启动？`curl http://localhost:8081/api/nav-menus` 是否通 |
| 菜单不全 | 见第四节，拉最新代码后 `docker compose down -v && docker compose up -d` 重建 |
| 后端连不上数据库 | 检查是否有两个 MySQL 容器：`docker ps \| grep mysql` |
| 前端 3001 端口被占 | 改 `vite.config.ts` 的 port，或杀掉占用进程 |
| `npm install` 慢/失败 | 换淘宝镜像：`npm config set registry https://registry.npmmirror.com` |

---

## 九、默认账号

初始化后默认管理员账号（见 `init/10-init-system-data.sql`）：

- 用户名：`admin`
- 密码：见 SQL 文件（通常为 `admin123` 或明文，登录后请修改）
