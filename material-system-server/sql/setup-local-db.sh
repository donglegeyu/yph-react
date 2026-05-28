#!/bin/bash
# MySQL本地数据库设置脚本

echo "=========================================="
echo "MySQL本地数据库设置"
echo "=========================================="

# MySQL连接配置
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASS="root123456"
DATABASE_NAME="material_system"

# 检查MySQL是否运行
echo "检查MySQL服务状态..."
if ! command -v mysql &> /dev/null; then
    echo "错误: 未找到mysql命令,请安装MySQL客户端"
    exit 1
fi

# 测试MySQL连接
echo "测试MySQL连接..."
if ! mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASS -e "SELECT 1" &> /dev/null; then
    echo "错误: 无法连接到MySQL,请确保:"
    echo "  1. MySQL服务正在运行"
    echo "  2. 用户名密码正确"
    echo "  3. MySQL服务地址和端口正确"
    exit 1
fi

echo "✓ MySQL连接成功"

# 创建数据库
echo "创建数据库 $DATABASE_NAME..."
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASS -e "CREATE DATABASE IF NOT EXISTS $DATABASE_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if [ $? -eq 0 ]; then
    echo "✓ 数据库创建成功"
else
    echo "✗ 数据库创建失败"
    exit 1
fi

# 导入SQL文件
echo "导入数据库表结构..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -f "$SCRIPT_DIR/schema-correct.sql" ]; then
    mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASS $DATABASE_NAME < "$SCRIPT_DIR/schema-correct.sql"
    if [ $? -eq 0 ]; then
        echo "✓ 表结构导入成功"
    else
        echo "✗ 表结构导入失败"
        exit 1
    fi
fi

# 导入初始数据
if [ -f "$SCRIPT_DIR/init-data.sql" ]; then
    echo "导入初始数据..."
    mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASS $DATABASE_NAME < "$SCRIPT_DIR/init-data.sql"
    if [ $? -eq 0 ]; then
        echo "✓ 初始数据导入成功"
    else
        echo "✗ 初始数据导入失败"
        exit 1
    fi
fi

echo "=========================================="
echo "✓ 数据库设置完成!"
echo "=========================================="
echo "数据库: $DATABASE_NAME"
echo "用户名: $MYSQL_USER"
echo "密码: $MYSQL_PASS"
echo ""
echo "现在可以启动应用了:"
echo "  ./start-server-local.sh"
