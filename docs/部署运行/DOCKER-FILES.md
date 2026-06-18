# Docker 部署文件说明

> **用途**：说明 yph-react 项目中所有 Docker 相关文件的写法、设计意图和使用方式
> **适用对象**：开发人员、运维人员
> **Last updated**: 2026-06-17

---

## 一、文件总览

本项目共有 5 个 Docker 相关文件，分为前端和后端两组：

| 文件 | 位置 | 类型 | 作用 |
|------|------|------|------|
| Dockerfile | [react-system/Dockerfile](../../react-system/Dockerfile) | 前端 | 构建前端镜像（node 构建 + nginx 托管） |
| nginx.conf | [react-system/nginx.conf](../../react-system/nginx.conf) | 前端 | Nginx 配置（静态托管 + API 代理） |
| .dockerignore | [react-system/.dockerignore](../../react-system/.dockerignore) | 前端 | 排除不需要的文件 |
| Dockerfile | [material-system-server/Dockerfile](../../material-system-server/Dockerfile) | 后端 | 构建后端镜像（maven 构建 + jre 运行） |
| docker-compose.yml | [material-system-server/docker-compose.yml](../../material-system-server/docker-compose.yml) | 后端 | 编排 MySQL + 后端容器 |

---

## 二、前端 Dockerfile

**文件路径**：`react-system/Dockerfile`

### 完整内容

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 设计说明：多阶段构建

这个 Dockerfile 使用了**多阶段构建（multi-stage build）**，分两个阶段：

#### 第一阶段：builder（构建产物）

```dockerfile
FROM node:20-alpine AS builder
```

| 指令 | 作用 | 设计意图 |
|------|------|---------|
| `FROM node:20-alpine AS builder` | 基于 Node 20 alpine（轻量） | alpine 版本体积小（~150MB vs 完整版 ~1GB） |
| `WORKDIR /app` | 设置工作目录 | 后续指令的相对路径基准 |
| `COPY package*.json ./` | **先只复制 package.json 和 lock 文件** | 利用 Docker 层缓存，依赖不变时不重新 npm install |
| `RUN npm config set registry ... && npm install` | 配置国内镜像 + 安装依赖 | npmmirror 加速国内构建 |
| `COPY . .` | 复制全部源码 | 放在 npm install 之后，源码变更不触发重装依赖 |
| `RUN npm run build` | 执行 `tsc -b && vite build` | 先 TypeScript 类型检查，再 Vite 打包 |

> **层缓存优化**：如果把 `COPY . .` 放在 `npm install` 前面，每次改任何源码都会重新安装依赖。分开写能让依赖层被缓存复用。

#### 第二阶段：运行时（最终镜像）

```dockerfile
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

| 指令 | 作用 | 设计意图 |
|------|------|---------|
| `FROM nginx:alpine` | 基于 nginx alpine | 最终镜像不含 node/npm，体积仅 ~50MB |
| `COPY --from=builder /app/dist ...` | **从 builder 阶段复制构建产物** | 只取 dist 目录，丢弃 node_modules 等构建工具 |
| `COPY nginx.conf ...` | 复制 Nginx 配置 | 覆盖 nginx 默认配置 |
| `EXPOSE 80` | 声明端口 | Nginx 默认监听 80 |

> **为什么用多阶段**：如果单阶段构建，最终镜像会包含 node_modules（~500MB）、TypeScript 编译器等，体积超过 1GB。多阶段构建后，最终镜像只有 nginx + dist 静态文件，约 50MB。

---

## 三、前端 nginx.conf

**文件路径**：`react-system/nginx.conf`

### 完整内容

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # 前端静态资源（SPA 单页应用，所有路由回退到 index.html）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存（带 hash 的文件长期缓存）
    location ~* \.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # index.html 不缓存（保证发布后立即生效）
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API 反向代理到后端容器
    location /api/ {
        proxy_pass http://material-backend-react:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # 上传文件代理
    location /uploads/ {
        proxy_pass http://material-backend-react:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 上传文件大小限制
    client_max_body_size 10m;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 配置逐块说明

#### 1. 基础配置

```nginx
server {
    listen 80;                    # 监听 80 端口
    server_name _;                # 匹配所有域名/IP
    root /usr/share/nginx/html;   # 静态文件根目录（与 Dockerfile 的 COPY 目标一致）
    index index.html;             # 默认首页
}
```

#### 2. gzip 压缩（减少传输体积）

```nginx
gzip on;
gzip_comp_level 6;               # 压缩级别 1-9，6 是性能和压缩比的平衡点
gzip_types text/css application/javascript ...;
```

效果：JS/CSS 文件传输体积减少 60%-80%。

#### 3. SPA 路由回退（关键）

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**为什么需要**：React 使用 `react-router-dom` 的 `history` 模式，前端路由（如 `/materials/create`）在服务器上没有对应文件。如果不回退，刷新页面会 404。`try_files` 把所有未匹配的路由都指向 `index.html`，交给 React Router 处理。

#### 4. 静态资源缓存策略

```nginx
# 带 hash 的文件（vite 产物如 index-a3f5b2.js）长期缓存
location ~* \.(?:js|css|png|...)$ {
    expires 30d;                              # 浏览器缓存 30 天
    add_header Cache-Control "public, immutable";  # immutable 表示文件永不变
}

# index.html 不缓存
location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

**为什么这样设计**：Vite 构建的 JS/CSS 文件名带 hash（如 `index-a3f5b2c4.js`），内容变了 hash 就变，所以可以放心长期缓存。但 `index.html` 引用的是哪个 hash 的文件，每次都要重新获取，所以不能缓存。

#### 5. API 反向代理

```nginx
location /api/ {
    proxy_pass http://material-backend-react:8081;   # 后端容器名:端口
    proxy_set_header X-Real-IP $remote_addr;          # 传递真实客户端 IP
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

**关键点**：
- `material-backend-react` 是后端容器名，通过 Docker 内部网络解析（前端容器必须和后端在同一个 Docker 网络）
- 这替代了开发模式下的 [vite.config.ts](../../react-system/vite.config.ts) 代理配置
- 前端代码里所有 `/api/xxx` 的请求，都会被 Nginx 转发到后端

#### 6. 上传文件代理

```nginx
location /uploads/ {
    proxy_pass http://material-backend-react:8081;
}
```

后端上传的文件存在 `/app/uploads` 目录，通过 `/uploads/` 路径访问。Nginx 把这个路径也代理到后端。

#### 7. 上传大小限制

```nginx
client_max_body_size 10m;
```

与后端 `application.yml` 的 `spring.servlet.multipart.max-request-size: 10MB` 对齐。

#### 8. 安全头

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;        # 防止点击劫持
add_header X-Content-Type-Options "nosniff" always;    # 防止 MIME 类型嗅探
add_header X-XSS-Protection "1; mode=block" always;    # XSS 过滤
```

---

## 四、前端 .dockerignore

**文件路径**：`react-system/.dockerignore`

### 完整内容

```
node_modules
dist
dist-ssr
.git
.gitignore
*.log
npm-debug.log*
.DS_Store
.vscode
.idea
docs
sql
```

### 作用

在 `COPY . .` 时排除这些文件，避免它们被复制到 Docker 构建上下文中。

| 排除项 | 原因 |
|--------|------|
| `node_modules` | 容器内会重新 `npm install`，本地的不能用（操作系统可能不同） |
| `dist` / `dist-ssr` | 容器内会重新 `npm run build`，不需要本地产物 |
| `.git` | 不需要版本历史 |
| `*.log` | 日志文件不影响构建 |
| `.DS_Store` | macOS 系统文件 |
| `.vscode` / `.idea` | 编辑器配置 |
| `docs` / `sql` | 文档和本地 SQL 不需要打入镜像 |

> **效果**：构建上下文从可能的几百 MB（含 node_modules）降到几 MB，构建速度大幅提升。

---

## 五、后端 Dockerfile

**文件路径**：`material-system-server/Dockerfile`

### 完整内容

```dockerfile
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 设计说明

同样是多阶段构建：

| 阶段 | 基础镜像 | 作用 |
|------|---------|------|
| builder | `maven:3.9.6-eclipse-temurin-17` | 含 Maven + JDK 17，用于编译打包 |
| 运行时 | `eclipse-temurin:17-jre` | 只含 JRE 17，用于运行 jar |

| 指令 | 作用 |
|------|------|
| `COPY pom.xml .` | 先复制 pom.xml（利用层缓存） |
| `COPY src ./src` | 再复制源码 |
| `RUN mvn package -DskipTests` | 编译打包（跳过测试加速） |
| `COPY --from=builder /app/target/*.jar app.jar` | 只取构建好的 jar |
| `ENTRYPOINT ["java", "-jar", "app.jar"]` | 容器启动时运行 jar |

> **注意**：Dockerfile 里 `EXPOSE 8080`，但实际后端运行在 8081 端口（由 `application.yml` 的 `server.port: 8081` 决定）。`EXPOSE` 只是文档声明，实际端口映射在 `docker-compose.yml` 中配置 `8081:8081`。

---

## 六、docker-compose.yml

**文件路径**：`material-system-server/docker-compose.yml`

### 核心配置

```yaml
services:
  mysql:                                    # MySQL 服务
    image: mysql:8.0
    container_name: material-mysql-react
    ports:
      - "3307:3306"                         # 宿主机 3307 → 容器 3306
    environment:
      MYSQL_ROOT_PASSWORD: root123456
      MYSQL_DATABASE: material_system_react
    volumes:
      - mysql-react-data:/var/lib/mysql     # 数据持久化
      - ./init:/docker-entrypoint-initdb.d  # 初始化 SQL 自动执行

  backend:                                  # 后端服务
    image: material-backend-react:latest
    container_name: material-backend-react
    ports:
      - "8081:8081"
    environment:
      SPRING_PROFILES_ACTIVE: local
      SPRING_DATASOURCE_URL: jdbc:mysql://material-mysql-react:3306/...
    depends_on:
      mysql:
        condition: service_started          # 等 MySQL 启动后再启动后端

volumes:
  mysql-react-data:
    name: material-mysql-react-data
    external: true                          # 使用外部创建的数据卷
```

### 关键设计点

| 配置 | 说明 |
|------|------|
| `container_name` | 固定容器名，前端 Nginx 通过此名访问后端 |
| `./init:/docker-entrypoint-initdb.d` | MySQL 首次启动自动执行 init SQL |
| `external: true` | 数据卷需提前 `docker volume create` 创建 |
| `depends_on` | 后端等 MySQL 启动后才启动（但不等 ready） |

---

## 七、构建与运行命令

### 前端

```bash
cd react-system

# 构建镜像
docker build -t material-frontend-react:latest .

# 运行容器（必须加入后端的 Docker 网络）
docker run -d \
  --name material-frontend-react \
  --network material-system-server_default \
  -p 80:80 \
  --restart unless-stopped \
  material-frontend-react:latest
```

### 后端

```bash
cd material-system-server

# 构建镜像
docker build -t material-backend-react:latest .

# 通过 docker-compose 启动（MySQL + 后端）
docker compose up -d

# 或只重建后端
./restart-safe.sh
```

---

## 八、镜像体积参考

| 镜像 | 体积 | 说明 |
|------|------|------|
| material-frontend-react | ~50 MB | nginx:alpine (~40MB) + dist 静态文件 (~10MB) |
| material-backend-react | ~350 MB | jre17 (~270MB) + jar (~80MB) |
| mysql:8.0 | ~550 MB | MySQL 官方镜像 |

> 前端镜像之所以小，是因为多阶段构建丢弃了 node_modules（~500MB）和构建工具。

---

## 九、相关文档

| 文档 | 路径 |
|------|------|
| 运维操作手册 | [docs/部署运行/OPS-MANUAL.md](./OPS-MANUAL.md) |
| 项目运行指南 | [docs/部署运行/RUNBOOK.md](./RUNBOOK.md) |
| 运维规范 | [.trae/rules.d/ops-rules.md](../../.trae/rules.d/ops-rules.md) |
