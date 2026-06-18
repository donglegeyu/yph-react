#!/bin/bash
# 本地启动脚本(不依赖Docker)

echo "=========================================="
echo "启动材料申请管理系统 - 本地模式"
echo "=========================================="

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查Java是否安装
if ! command -v java &> /dev/null; then
    echo "错误: 未找到Java,请安装JDK 17或更高版本"
    exit 1
fi

# 检查Java版本
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "错误: 需要JDK 17或更高版本,当前版本: $JAVA_VERSION"
    exit 1
fi

echo "✓ Java版本检查通过: JDK $JAVA_VERSION"

# 检查JAR文件是否存在
JAR_FILE="$SCRIPT_DIR/target/material-system-server-1.0.0.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo "警告: 未找到编译好的JAR文件,正在编译..."
    if command -v mvn &> /dev/null; then
        mvn clean package -DskipTests
        if [ $? -ne 0 ]; then
            echo "✗ Maven编译失败"
            exit 1
        fi
        echo "✓ Maven编译成功"
    else
        echo "错误: 未找到Maven,无法编译项目"
        exit 1
    fi
else
    echo "✓ JAR文件已就绪"
fi

# 检查数据库是否可连接
echo "检查MySQL数据库连接..."
if ! mysql -h localhost -P 3306 -u root -proot123456 -e "SELECT 1" &> /dev/null; then
    echo "警告: 无法连接到MySQL数据库,请确保:"
    echo "  1. MySQL服务正在运行"
    echo "  2. 已运行: ./sql/setup-local-db.sh"
    echo ""
    read -p "是否继续启动?(y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        exit 0
    fi
else
    echo "✓ MySQL数据库连接正常"
fi

# 启动应用
echo ""
echo "启动应用..."
echo "=========================================="

# 使用application-local.yml配置文件
java -jar "$JAR_FILE" --spring.profiles.active=local
