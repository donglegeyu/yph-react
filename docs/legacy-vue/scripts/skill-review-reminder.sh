#!/bin/bash

# Skill 知识进化提醒脚本
# 每周一 9:00 自动运行，提醒进行知识回顾和 Skill 生成

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
echo -e "${BLUE}📅 每周知识回顾提醒${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

cd "$PROJECT_ROOT"

# ==================== 1. 检查上周是否有更新 ====================
echo -e "${YELLOW}[1/4] 检查上周更新...${NC}"

# 获取上周日期
LAST_WEEK=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d 2>/dev/null)

# 检查 memory 是否有更新
if [ -d ".trae/memory" ]; then
  MEMORY_UPDATES=$(find .trae/memory -name "*.md" -newer /tmp/last_week_check 2>/dev/null | wc -l || echo 0)
  echo "  📝 Memory 更新文件数: $MEMORY_UPDATES"
fi

# 检查 skills 是否有更新
if [ -d ".trae/skills" ]; then
  SKILLS_UPDATES=$(find .trae/skills -name "*.md" -newer /tmp/last_week_check 2>/dev/null | wc -l || echo 0)
  echo "  🛠️ Skills 更新文件数: $SKILLS_UPDATES"
fi

echo ""

# ==================== 2. 运行扫描脚本 ====================
echo -e "${YELLOW}[2/4] 扫描高价值内容...${NC}"

if [ -f "./scripts/scan-memory-for-skills.sh" ]; then
  # 只显示摘要，不生成完整报告
  bash ./scripts/scan-memory-for-skills.sh 2>/dev/null | grep -E "( Patterns:| Errors:| Workflows:| 建议)"
fi

echo ""

# ==================== 3. 检查 skill 建议 ====================
echo -e "${YELLOW}[3/4] 检查 Skill 建议...${NC}"

if [ -f ".trae/skill-suggestions.md" ]; then
  # 获取建议数量
  SUGGESTION_COUNT=$(grep -c "^### " .trae/skill-suggestions.md 2>/dev/null || echo 0)
  
  if [ "$SUGGESTION_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}💡 发现 $SUGGESTION_COUNT 个建议${NC}"
    echo "  查看详情: cat .trae/skill-suggestions.md"
  else
    echo "  📭 暂无新的 Skill 建议"
  fi
else
  echo "  📭 还未运行过扫描，建议运行: ./scripts/scan-memory-for-skills.sh"
fi

echo ""

# ==================== 4. 总结 ====================
echo -e "${YELLOW}[4/4] 本周建议${NC}"
echo ""

echo -e "${CYAN}建议执行以下操作：${NC}"
echo ""
echo "  1. 📝 运行扫描: ./scripts/scan-memory-for-skills.sh"
echo "  2. 📊 查看建议: cat .trae/skill-suggestions.md"
echo "  3. 🛠️ 生成 Skill: 根据建议生成新的 Skill"
echo "  4. 🔍 审查 Skill: 使用 skill-vetter 审查"
echo "  5. 📚 更新 memory: 补充本周学到的新经验"
echo ""

# 更新检查时间戳
touch /tmp/last_week_check

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ 知识回顾提醒完成${NC}"
echo -e "${BLUE}=========================================${NC}"
