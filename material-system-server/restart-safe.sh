#!/bin/bash
# 安全重启后端脚本
# 功能：检查容器状态 → 重建镜像 → 安全重启 → 验证数据库连接

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
MYSQL_CONTAINER="material-mysql-react"
BACKEND_CONTAINER="material-backend-react"

echo "=========================================="
echo "  后端安全重启脚本"
echo "=========================================="

# === 第一步：环境检查 ===
echo ""
echo "[1/5] 检查 Docker 环境..."

MYSQL_COUNT=$(docker ps --filter "name=$MYSQL_CONTAINER" --format '{{.Names}}' | wc -l | tr -d ' ')

if [ "$MYSQL_COUNT" -gt 1 ]; then
    echo "❌ 警告：发现 $MYSQL_COUNT 个 MySQL 容器！"
    docker ps --filter "name=$MYSQL_CONTAINER" --format '  - {{.Names}} ({{.Status}})'
    echo ""
    echo "这可能导致数据分叉。请手动清理多余的容器后重试。"
    echo "  docker ps --filter name=$MYSQL_CONTAINER"
    exit 1
elif [ "$MYSQL_COUNT" -eq 0 ]; then
    echo "⚠️  MySQL 容器未运行，将启动全新环境..."
else
    echo "✅ MySQL 容器正常（仅 $MYSQL_COUNT 个）"
fi

# === 第二步：构建镜像 ===
echo ""
echo "[2/5] 构建后端镜像..."

docker build -t material-backend-react:latest "$SCRIPT_DIR"

echo "✅ 镜像构建完成"

# === 第三步：停止旧后端 ===
echo ""
echo "[3/5] 停止旧后端容器..."

docker stop "$BACKEND_CONTAINER" 2>/dev/null || true
docker rm "$BACKEND_CONTAINER" 2>/dev/null || true

echo "✅ 旧容器已清理"

# === 第四步：启动新后端 ===
echo ""
echo "[4/5] 启动新后端容器..."

docker compose -f "$COMPOSE_FILE" up -d backend

echo "✅ 容器已启动，等待健康检查..."

# === 第五步：验证 ===
echo ""
echo "[5/5] 验证服务..."

for i in $(seq 1 15); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/nav-menus 2>/dev/null | grep -q 200; then
        echo "✅ 后端服务正常 (尝试 $i 次)"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ 后端启动超时，请检查日志: docker logs $BACKEND_CONTAINER"
        exit 1
    fi
    sleep 2
done

echo ""
echo "=========================================="
echo "  重启完成"
echo "=========================================="
echo "  后端: http://localhost:8081"
echo "  前端: http://localhost:3001"
echo "  MySQL: docker exec -it $MYSQL_CONTAINER mysql -uroot -proot123456"
echo ""
