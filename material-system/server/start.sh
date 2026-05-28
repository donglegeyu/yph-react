#!/bin/bash

# 图标配置服务启动脚本

cd "$(dirname "$0")"

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "安装依赖..."
  npm install express cors
fi

# 启动服务
echo "启动图标配置服务 (端口 8081)..."
node index.js
