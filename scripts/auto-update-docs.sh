#!/bin/bash

# 文档自动更新脚本
# 扫描代码变更，自动更新功能开发文档

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}文档自动更新脚本${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 切换到项目根目录
cd "$PROJECT_ROOT"

# ==================== 1. 检测代码变更 ====================
echo -e "${YELLOW}[1/5] 检测代码变更...${NC}"

# 获取变更的文件列表
CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo -e "${YELLOW}没有检测到代码变更${NC}"
  exit 0
fi

echo "变更文件："
echo "$CHANGED_FILES" | head -20
FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l)
echo "总计: $FILE_COUNT 个文件"

# ==================== 2. 分类变更文件 ====================
echo ""
echo -e "${YELLOW}[2/5] 分类变更文件...${NC}"

# 前端变更
FRONTEND_CHANGED=$(echo "$CHANGED_FILES" | grep -E "^material-system/src/" || true)
# 后端变更
BACKEND_CHANGED=$(echo "$CHANGED_FILES" | grep -E "^material-system-server/src/" || true)
# Vue 文件
VUE_CHANGED=$(echo "$CHANGED_FILES" | grep -E "\.vue$" || true)
# Java 文件
JAVA_CHANGED=$(echo "$CHANGED_FILES" | grep -E "\.java$" || true)

if [ -n "$FRONTEND_CHANGED" ]; then
  echo -e "${GREEN}✅ 检测到前端变更：${NC}"
  echo "$FRONTEND_CHANGED" | sed 's/^/   /'
fi

if [ -n "$BACKEND_CHANGED" ]; then
  echo -e "${GREEN}✅ 检测到后端变更：${NC}"
  echo "$BACKEND_CHANGED" | sed 's/^/   /'
fi

if [ -n "$VUE_CHANGED" ]; then
  echo -e "${GREEN}✅ 检测到 Vue 组件变更：${NC}"
  echo "$VUE_CHANGED" | sed 's/^/   /'
fi

if [ -n "$JAVA_CHANGED" ]; then
  echo -e "${GREEN}✅ 检测到 Java 文件变更：${NC}"
  echo "$JAVA_CHANGED" | sed 's/^/   /'
fi

# ==================== 3. 更新功能开发文档 ====================
echo ""
echo -e "${YELLOW}[3/5] 更新功能开发文档...${NC}"

TODAY=$(date +%Y-%m-%d)

# 更新功能开发文档的知识索引日期
if [ -f "docs/功能开发文档/功能开发文档.md" ]; then
  echo "更新功能开发文档索引日期..."

  # 更新主文档索引
  sed -i "s/| 更新日期 | [^ ]* |/| 更新日期 | $TODAY |/g" docs/功能开发文档/功能开发文档.md 2>/dev/null || true

  # 更新子文档索引
  for doc in docs/功能开发文档/*.md; do
    if [ -f "$doc" ] && [ "$(basename "$doc")" != "功能开发文档.md" ]; then
      sed -i "s/| 更新日期 | [^ ]* |/| 更新日期 | $TODAY |/g" "$doc" 2>/dev/null || true
    fi
  done

  echo -e "${GREEN}✅ 功能开发文档索引已更新${NC}"
fi

# ==================== 4. 更新 API 文档（如果检测到 Java 变更） ====================
if [ -n "$JAVA_CHANGED" ]; then
  echo ""
  echo -e "${YELLOW}[4/5] 更新 API 文档...${NC}"

  if [ -f "docs/功能开发文档/功能开发文档.API.md" ]; then
    echo "检测到 Java 文件变更，提示更新 API 文档..."

    # 提取新增的 Controller 类
    for java_file in $JAVA_CHANGED; do
      if [[ "$java_file" == *Controller.java ]]; then
        filename=$(basename "$java_file" .java)
        echo "   发现 Controller: $filename"

        # 这里可以添加自动提取 API 端点的逻辑
        # 简化版本：只是标记需要更新
      fi
    done

    # 更新 API 文档日期
    sed -i "s/| 更新日期 | [^ ]* |/| 更新日期 | $TODAY |/g" docs/功能开发文档/功能开发文档.API.md 2>/dev/null || true
    echo -e "${GREEN}✅ API 文档索引已更新${NC}"
  fi
fi

# ==================== 5. 更新组件文档（如果检测到 Vue 变更） ====================
if [ -n "$VUE_CHANGED" ]; then
  echo ""
  echo -e "${YELLOW}[5/5] 更新组件文档...${NC}"

  if [ -f "docs/功能开发文档/功能开发文档.组件规范.md" ]; then
    echo "检测到 Vue 组件变更，提示更新组件文档..."

    # 提取新增的组件
    for vue_file in $VUE_CHANGED; do
      if [[ "$vue_file" == *Component.vue ]]; then
        filename=$(basename "$vue_file" .vue)
        echo "   发现组件: $filename"

        # 统计组件行数
        if [ -f "$vue_file" ]; then
          lines=$(wc -l < "$vue_file")
          echo "   行数: $lines"
        fi
      fi
    done

    # 更新组件文档日期
    sed -i "s/| 更新日期 | [^ ]* |/| 更新日期 | $TODAY |/g" docs/功能开发文档/功能开发文档.组件规范.md 2>/dev/null || true
    echo -e "${GREEN}✅ 组件文档索引已更新${NC}"
  fi
fi

# ==================== 完成 ====================
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ 文档更新完成！${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "更新日期: $TODAY"
echo ""
echo "请检查以下变更："
git diff --stat docs/ 2>/dev/null || echo "无文档变更"
