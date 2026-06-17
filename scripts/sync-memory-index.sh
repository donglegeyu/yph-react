#!/bin/bash

# Memory 索引同步脚本
# 扫描 memory/ 目录，统计各分类条目数

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Memory 索引同步脚本${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 切换到项目根目录
cd "$PROJECT_ROOT"

MEMORY_DIR="memory"
MEMORY_INDEX="memory/INDEX.md"

# ==================== 1. 检查 memory/ 目录 ====================
echo -e "${YELLOW}[1/2] 扫描 memory/ 目录...${NC}"

if [ ! -d "$MEMORY_DIR" ]; then
  echo -e "${RED}❌ 错误：memory/ 目录不存在${NC}"
  exit 1
fi

TOTAL=0
for category_dir in "$MEMORY_DIR"/*/; do
  if [ -d "$category_dir" ]; then
    category=$(basename "$category_dir")
    count=$(find "$category_dir" -maxdepth 1 -name "*.md" ! -name "INDEX.md" -type f | wc -l | tr -d ' ')
    echo "  $category: $count 条"
    TOTAL=$((TOTAL + count))
  fi
done

echo ""
echo "总计: $TOTAL 条记忆"

# ==================== 2. 检查索引文件 ====================
echo ""
echo -e "${YELLOW}[2/2] 检查索引文件...${NC}"

if [ -f "$MEMORY_INDEX" ]; then
  echo -e "${GREEN}✅ 主索引存在: $MEMORY_INDEX${NC}"
  
  # 检查各子目录的 INDEX.md
  for category_dir in "$MEMORY_DIR"/*/; do
    if [ -d "$category_dir" ]; then
      category=$(basename "$category_dir")
      if [ -f "$category_dir/INDEX.md" ]; then
        echo -e "${GREEN}  ✅ $category/INDEX.md${NC}"
      else
        echo -e "${YELLOW}  ⚠️  $category/INDEX.md 缺失${NC}"
      fi
    fi
  done
else
  echo -e "${RED}❌ 主索引缺失: $MEMORY_INDEX${NC}"
fi

# ==================== 完成 ====================
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ Memory 同步检查完成${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "摘要："
echo "  - 位置: memory/"
echo "  - 总条目: $TOTAL"
echo "  - 主索引: memory/INDEX.md"
echo ""
