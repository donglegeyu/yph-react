#!/bin/bash

# 提交确认脚本
# ⚠️ 让你手动确认每个变更后再提交，确保可控

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}提交确认脚本${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 切换到项目根目录
cd "$PROJECT_ROOT"

# ==================== 1. 检测变更 ====================
echo -e "${YELLOW}[1/4] 检测变更...${NC}"
echo ""

# 获取所有变更
ALL_CHANGES=$(git status --porcelain)
if [ -z "$ALL_CHANGES" ]; then
  echo -e "${YELLOW}没有检测到任何变更${NC}"
  exit 0
fi

echo "变更文件："
echo "$ALL_CHANGES"
echo ""

# 分类变更
CODE_CHANGES=$(echo "$ALL_CHANGES" | grep -E "^( M|M |MM|A |??)" | grep -E "(material-system/src/|material-system-server/src/)" || true)
DOCS_CHANGES=$(echo "$ALL_CHANGES" | grep -E "^( M|M |MM|A |??)" | grep -E "docs/" || true)
MEMORY_CHANGES=$(echo "$ALL_CHANGES" | grep -E "^( M|M |MM|A |??)" | grep -E "\.trae/memory/" || true)
WORKFLOW_CHANGES=$(echo "$ALL_CHANGES" | grep -E "^( M|M |MM|A |??)" | grep -E "\.github/" || true)
SCRIPTS_CHANGES=$(echo "$ALL_CHANGES" | grep -E "^( M|M |MM|A |??)" | grep -E "^scripts/" || true)

# ==================== 2. 显示变更摘要 ====================
echo -e "${YELLOW}[2/4] 变更摘要${NC}"
echo ""

if [ -n "$CODE_CHANGES" ]; then
  echo -e "${GREEN}✅ 代码变更：${NC}"
  echo "$CODE_CHANGES" | sed 's/^/   /'
  echo ""
fi

if [ -n "$DOCS_CHANGES" ]; then
  echo -e "${GREEN}✅ 文档变更：${NC}"
  echo "$DOCS_CHANGES" | sed 's/^/   /'
  echo ""
fi

if [ -n "$MEMORY_CHANGES" ]; then
  echo -e "${GREEN}✅ Memory 变更：${NC}"
  echo "$MEMORY_CHANGES" | sed 's/^/   /'
  echo ""
fi

if [ -n "$WORKFLOW_CHANGES" ]; then
  echo -e "${GREEN}✅ Workflow 变更：${NC}"
  echo "$WORKFLOW_CHANGES" | sed 's/^/   /'
  echo ""
fi

if [ -n "$SCRIPTS_CHANGES" ]; then
  echo -e "${GREEN}✅ 脚本变更：${NC}"
  echo "$SCRIPTS_CHANGES" | sed 's/^/   /'
  echo ""
fi

# ==================== 3. 逐个确认提交 ====================
echo -e "${YELLOW}[3/4] 提交确认${NC}"
echo ""

# 提交信息
COMMIT_MSG=""

# 代码变更
if [ -n "$CODE_CHANGES" ]; then
  echo -e "${CYAN}--- 代码变更 ---${NC}"
  echo "$CODE_CHANGES"
  echo ""
  read -p "是否提交代码变更？(y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add $(echo "$CODE_CHANGES" | awk '{print $2}')
    echo -e "${GREEN}✅ 代码已添加到暂存区${NC}"
    COMMIT_MSG="${COMMIT_MSG}[代码] "
  fi
  echo ""
fi

# 文档变更
if [ -n "$DOCS_CHANGES" ]; then
  echo -e "${CYAN}--- 文档变更 ---${NC}"
  echo "$DOCS_CHANGES"
  echo ""
  read -p "是否提交文档变更？(y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add $(echo "$DOCS_CHANGES" | awk '{print $2}')
    echo -e "${GREEN}✅ 文档已添加到暂存区${NC}"
    COMMIT_MSG="${COMMIT_MSG}[文档] "
  fi
  echo ""
fi

# Memory 变更
if [ -n "$MEMORY_CHANGES" ]; then
  echo -e "${CYAN}--- Memory 变更 ---${NC}"
  echo "$MEMORY_CHANGES"
  echo ""
  read -p "是否提交 Memory 变更？(y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add $(echo "$MEMORY_CHANGES" | awk '{print $2}')
    echo -e "${GREEN}✅ Memory 已添加到暂存区${NC}"
    COMMIT_MSG="${COMMIT_MSG}[Memory] "
  fi
  echo ""
fi

# Workflow 变更
if [ -n "$WORKFLOW_CHANGES" ]; then
  echo -e "${CYAN}--- Workflow 变更 ---${NC}"
  echo "$WORKFLOW_CHANGES"
  echo ""
  read -p "是否提交 Workflow 变更？(y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add $(echo "$WORKFLOW_CHANGES" | awk '{print $2}')
    echo -e "${GREEN}✅ Workflow 已添加到暂存区${NC}"
    COMMIT_MSG="${COMMIT_MSG}[Workflow] "
  fi
  echo ""
fi

# 脚本变更
if [ -n "$SCRIPTS_CHANGES" ]; then
  echo -e "${CYAN}--- 脚本变更 ---${NC}"
  echo "$SCRIPTS_CHANGES"
  echo ""
  read -p "是否提交脚本变更？(y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add $(echo "$SCRIPTS_CHANGES" | awk '{print $2}')
    echo -e "${GREEN}✅ 脚本已添加到暂存区${NC}"
    COMMIT_MSG="${COMMIT_MSG}[脚本] "
  fi
  echo ""
fi

# ==================== 4. 提交变更 ====================
echo -e "${YELLOW}[4/4] 提交变更${NC}"
echo ""

# 检查是否有暂存的变更
if ! git diff --cached --quiet; then
  echo "暂存的变更："
  git diff --cached --stat
  echo ""

  # 获取提交信息
  echo "请输入提交信息（直接回车使用默认）："
  read -e -i "${COMMIT_MSG}更新" USER_MSG
  if [ -z "$USER_MSG" ]; then
    USER_MSG="${COMMIT_MSG}更新"
  fi

  echo ""
  echo "提交信息：$USER_MSG"
  echo ""

  read -p "确认提交？(y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "$USER_MSG"
    echo ""
    echo -e "${GREEN}✅ 提交成功！${NC}"
    echo ""
    read -p "是否立即推送？(y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git push
      echo -e "${GREEN}✅ 推送成功！${NC}"
    else
      echo "已跳过推送，请稍后手动推送"
    fi
  else
    echo -e "${YELLOW}已取消提交${NC}"
    echo "暂存的变更仍然在暂存区，可使用以下命令："
    echo "  git commit -m '提交信息'  # 提交"
    echo "  git reset HEAD           # 取消暂存"
  fi
else
  echo -e "${YELLOW}没有暂存的变更，无需提交${NC}"
fi

# ==================== 完成 ====================
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}脚本执行完成${NC}"
echo -e "${BLUE}=========================================${NC}"
