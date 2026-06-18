# ============================================
# 前端 Dockerfile (react-system)
# React 19 + Vite 8 + TypeScript → Nginx
# ============================================

# ---------- 阶段1: Node 构建 ----------
FROM registry.zrhsh.com/library/node:22-slim AS builder
WORKDIR /build

# 利用 Docker 缓存：先复制依赖文件
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# ---------- 阶段2: Nginx 运行时 ----------
FROM registry.zrhsh.com/library/nginx:alpine


# 复制构建产物并设置权限
COPY --from=builder /build/dist /usr/share/nginx/html

# 复制 Nginx 配置（SPA 路由 + API 反代）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
