#!/bin/bash

# Memory 扫描脚本 - 检测高价值内容建议生成 Skill
# 扫描 patterns/、errors/、workflows/ 目录，识别可生成 Skill 的内容

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_DIR="$PROJECT_ROOT/.trae/memory"
SKILLS_DIR="$PROJECT_ROOT/.trae/skills"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Memory Skill 生成建议扫描${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 切换到项目根目录
cd "$PROJECT_ROOT"

# ==================== 统计变量 ====================
HIGH_VALUE_PATTERNS=""
HIGH_VALUE_ERRORS=""
HIGH_VALUE_WORKFLOWS=""

# ==================== 1. 扫描 patterns/ ====================
echo -e "${YELLOW}[1/4] 扫描 patterns/ 目录...${NC}"

if [ -d "$MEMORY_DIR/patterns" ]; then
  for pattern_file in "$MEMORY_DIR/patterns"/*.md; do
    [ -f "$pattern_file" ] || continue
    
    pattern_name=$(basename "$pattern_file" .md)
    
    # 跳过 INDEX 文件
    [ "$pattern_name" = "INDEX" ] && continue
    
    pattern_title=$(grep -m1 "^#" "$pattern_file" 2>/dev/null | sed 's/^#* //' | head -c 50)
    [ -z "$pattern_title" ] && pattern_title="$pattern_name"
    
    # 统计被引用次数
    ref_count=$(grep -r "$pattern_name" "$MEMORY_DIR" --include="*.md" 2>/dev/null | grep -v "$pattern_file" | wc -l | tr -d ' ')
    
    # 统计在代码中的使用次数
    code_refs=$(grep -r "$pattern_name" "material-system/src" --include="*.vue" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    [ -z "$code_refs" ] && code_refs=0
    
    total_refs=$((ref_count + code_refs))
    
    echo "  📝 $pattern_name: 被引用 $total_refs 次 (memory: $ref_count, code: $code_refs)"
    
    if [ "$total_refs" -ge 3 ]; then
      HIGH_VALUE_PATTERNS="${HIGH_VALUE_PATTERNS}【${pattern_name}】${pattern_title}（${total_refs}次）\n"
    fi
  done
fi

echo ""

# ==================== 2. 扫描 errors/ ====================
echo -e "${YELLOW}[2/4] 扫描 errors/ 目录...${NC}"

if [ -d "$MEMORY_DIR/errors" ]; then
  for error_file in "$MEMORY_DIR/errors"/*.md; do
    [ -f "$error_file" ] || continue
    
    error_name=$(basename "$error_file" .md)
    
    # 跳过 INDEX 文件
    [ "$error_name" = "INDEX" ] && continue
    
    error_title=$(grep -m1 "^#" "$error_file" 2>/dev/null | sed 's/^#* //' | head -c 50)
    [ -z "$error_title" ] && error_title="$error_name"
    
    # 统计被引用次数
    ref_count=$(grep -r "$error_name" "$MEMORY_DIR" --include="*.md" 2>/dev/null | grep -v "$error_file" | wc -l | tr -d ' ')
    
    # 统计解决方案数量
    solution_count=$(grep -c "^## 解决方案" "$error_file" 2>/dev/null | tr -d ' ')
    [ -z "$solution_count" ] && solution_count=0
    
    echo "  ⚠️  $error_name: 被引用 $ref_count 次, 解决方案 $solution_count 个"
    
    if [ "$ref_count" -ge 2 ] && [ "$solution_count" -ge 1 ]; then
      HIGH_VALUE_ERRORS="${HIGH_VALUE_ERRORS}【${error_name}】${error_title}（${ref_count}次引用, ${solution_count}个解决方案）\n"
    fi
  done
fi

echo ""

# ==================== 3. 扫描 workflows/ ====================
echo -e "${YELLOW}[3/4] 扫描 workflows/ 目录...${NC}"

if [ -d "$MEMORY_DIR/workflows" ]; then
  for workflow_file in "$MEMORY_DIR/workflows"/*.md; do
    [ -f "$workflow_file" ] || continue
    
    workflow_name=$(basename "$workflow_file" .md)
    
    # 跳过 INDEX 文件
    [ "$workflow_name" = "INDEX" ] && continue
    
    workflow_title=$(grep -m1 "^#" "$workflow_file" 2>/dev/null | sed 's/^#* //' | head -c 50)
    [ -z "$workflow_title" ] && workflow_title="$workflow_name"
    
    # 统计步骤数量
    step_count=$(grep -c "^## " "$workflow_file" 2>/dev/null | tr -d ' ')
    [ -z "$step_count" ] && step_count=0
    
    # 统计被引用次数
    ref_count=$(grep -r "$workflow_name" "$MEMORY_DIR" --include="*.md" 2>/dev/null | grep -v "$workflow_file" | wc -l | tr -d ' ')
    
    echo "  🔄 $workflow_name: $step_count 步, 被引用 $ref_count 次"
    
    if [ "$step_count" -ge 4 ] && [ "$ref_count" -ge 2 ]; then
      HIGH_VALUE_WORKFLOWS="${HIGH_VALUE_WORKFLOWS}【${workflow_name}】${workflow_title}（${step_count}步, ${ref_count}次引用）\n"
    fi
  done
fi

echo ""

# ==================== 4. 生成建议报告 ====================
echo -e "${YELLOW}[4/4] 生成建议报告...${NC}"
echo ""

# 检查是否已有 skills 目录
if [ ! -d "$SKILLS_DIR" ]; then
  mkdir -p "$SKILLS_DIR"
fi

# 生成报告
REPORT_FILE="$PROJECT_ROOT/.trae/skill-suggestions.md"

cat > "$REPORT_FILE" << 'HEADER'
# Skill 生成建议报告

> 自动生成 - 请根据实际情况决定是否生成 Skill

HEADER

echo "生成时间：$(date '+%Y-%m-%d %H:%M')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Patterns 建议
if [ -n "$HIGH_VALUE_PATTERNS" ]; then
  echo "## 📝 可生成 Skill 的 Patterns" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo -e "$HIGH_VALUE_PATTERNS" | while read line; do
    [ -z "$line" ] && continue
    echo "- $line" >> "$REPORT_FILE"
  done
  echo "" >> "$REPORT_FILE"
fi

# Errors 建议
if [ -n "$HIGH_VALUE_ERRORS" ]; then
  echo "## ⚠️ 可生成 Skill 的错误处理" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo -e "$HIGH_VALUE_ERRORS" | while read line; do
    [ -z "$line" ] && continue
    echo "- $line" >> "$REPORT_FILE"
  done
  echo "" >> "$REPORT_FILE"
fi

# Workflows 建议
if [ -n "$HIGH_VALUE_WORKFLOWS" ]; then
  echo "## 🔄 可生成 Skill 的 Workflows" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo -e "$HIGH_VALUE_WORKFLOWS" | while read line; do
    [ -z "$line" ] && continue
    echo "- $line" >> "$REPORT_FILE"
  done
  echo "" >> "$REPORT_FILE"
fi

# 如果没有高价值内容
if [ -z "$HIGH_VALUE_PATTERNS" ] && [ -z "$HIGH_VALUE_ERRORS" ] && [ -z "$HIGH_VALUE_WORKFLOWS" ]; then
  echo "## 📭 暂无高价值建议" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "当前 memory 内容还不够丰富，建议继续积累后再生成 Skill。" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "**以下是当前内容的引用统计：**" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # 添加当前统计摘要
  echo "### Patterns 引用情况" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  if [ -d "$MEMORY_DIR/patterns" ]; then
    for pattern_file in "$MEMORY_DIR/patterns"/*.md; do
      if [ -f "$pattern_file" ]; then
        pattern_name=$(basename "$pattern_file" .md)
        if [ "$pattern_name" != "INDEX" ]; then
          ref_count=$(grep -r "$pattern_name" "$MEMORY_DIR" --include="*.md" 2>/dev/null | grep -v "$pattern_file" | wc -l | tr -d ' ')
          echo "- \`$pattern_name\`: $ref_count 次" >> "$REPORT_FILE"
        fi
      fi
    done
  fi
  echo "" >> "$REPORT_FILE"
  
  echo "### Workflows 引用情况" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  if [ -d "$MEMORY_DIR/workflows" ]; then
    for workflow_file in "$MEMORY_DIR/workflows"/*.md; do
      if [ -f "$workflow_file" ]; then
        workflow_name=$(basename "$workflow_file" .md)
        if [ "$workflow_name" != "INDEX" ]; then
          ref_count=$(grep -r "$workflow_name" "$MEMORY_DIR" --include="*.md" 2>/dev/null | grep -v "$workflow_file" | wc -l | tr -d ' ')
          echo "- \`$workflow_name\`: $ref_count 次" >> "$REPORT_FILE"
        fi
      fi
    done
  fi
fi

echo "## 💡 建议操作" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. 查看上述统计，继续积累相关经验" >> "$REPORT_FILE"
echo "2. 当引用次数达到阈值（Patterns ≥3, Workflows ≥2）时，考虑生成 Skill" >> "$REPORT_FILE"
echo "3. 运行 \`git log\` 查看最近的知识贡献" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# ==================== 完成 ====================
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ 扫描完成！${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 统计高价值内容数量
pattern_count=$(echo "$HIGH_VALUE_PATTERNS" | grep -c "【" || echo 0)
error_count=$(echo "$HIGH_VALUE_ERRORS" | grep -c "【" || echo 0)
workflow_count=$(echo "$HIGH_VALUE_WORKFLOWS" | grep -c "【" || echo 0)

echo "扫描结果："
echo "  - Patterns: $pattern_count 个高价值"
echo "  - Errors: $error_count 个高价值"
echo "  - Workflows: $workflow_count 个高价值"
echo ""
echo -e "详细报告: ${YELLOW}$REPORT_FILE${NC}"
echo ""

# 如果有高价值内容，提示用户
if [ "$pattern_count" -gt 0 ] || [ "$error_count" -gt 0 ] || [ "$workflow_count" -gt 0 ]; then
  echo -e "${GREEN}💡 发现高价值内容，建议查看报告并考虑生成 Skill${NC}"
fi
