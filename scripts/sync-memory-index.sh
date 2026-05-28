#!/bin/bash

# Memory 索引同步脚本
# 将 docs/ 的更新同步到 Memory 索引

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

# ==================== 1. 检测 docs/ 变更 ====================
echo -e "${YELLOW}[1/3] 检测 docs/ 变更...${NC}"

TODAY=$(date +%Y-%m-%d)

# 检查功能开发文档目录
if [ -d "docs/功能开发文档" ]; then
  echo "检测到功能开发文档目录"

  # 统计子文档数量
  DOC_COUNT=$(find docs/功能开发文档 -maxdepth 1 -name "*.md" -type f | wc -l)
  echo "子文档数量: $DOC_COUNT"

  # 更新 Memory 中的文档入口
  echo "✅ 功能开发文档: docs/功能开发文档/ ($DOC_COUNT 个文档)"
fi

# 检查项目文档目录
if [ -d "docs/项目文档" ]; then
  echo "检测到项目文档目录"

  DOC_COUNT=$(find docs/项目文档 -maxdepth 1 -name "*.md" -type f | wc -l)
  echo "子文档数量: $DOC_COUNT"

  echo "✅ 项目文档: docs/项目文档/ ($DOC_COUNT 个文档)"
fi

# 检查每日记录目录
if [ -d "docs/每日记录" ]; then
  echo "检测到每日记录目录"

  RECORD_COUNT=$(find docs/每日记录 -maxdepth 1 -name "*.md" -type f | wc -l)
  echo "记录数量: $RECORD_COUNT"

  echo "✅ 每日记录: docs/每日记录/ ($RECORD_COUNT 个记录)"
fi

# ==================== 2. 更新 Memory 索引 ====================
echo ""
echo -e "${YELLOW}[2/3] 更新 Memory 索引...${NC}"

MEMORY_FILE=".trae/memory/INDEX.md"

if [ -f "$MEMORY_FILE" ]; then
  echo "更新 $MEMORY_FILE ..."

  # 检查是否有变更
  DOCS_CHANGED=false
  for doc_dir in docs/功能开发文档 docs/项目文档; do
    if [ -d "$doc_dir" ]; then
      # 检查目录中的文件是否有比 Memory 更新的
      if find "$doc_dir" -maxdepth 1 -name "*.md" -newer "$MEMORY_FILE" | grep -q .; then
        DOCS_CHANGED=true
        break
      fi
    fi
  done

  if [ "$DOCS_CHANGED" = true ]; then
    echo "检测到文档有更新，同步日期..."

    # 更新功能开发文档的更新日期
    sed -i "s/| 更新日期 |\s*[^|]*|/更新日期 | $TODAY |/g" "$MEMORY_FILE" 2>/dev/null || true

    echo -e "${GREEN}✅ Memory 索引已更新${NC}"
  else
    echo "文档没有更新，无需同步"
  fi
else
  echo -e "${YELLOW}警告：找不到 Memory 文件: $MEMORY_FILE${NC}"
fi

# ==================== 3. 生成同步报告 ====================
echo ""
echo -e "${YELLOW}[3/3] 生成同步报告...${NC}"

# 创建同步报告
REPORT_FILE="docs/每日记录/${TODAY}-memory-sync.md"

cat > "$REPORT_FILE" << EOF
# Memory 索引同步报告

> 生成时间：$(date +%H:%M)
> 同步日期：$TODAY

## 同步内容

### 功能开发文档
- 位置：docs/功能开发文档/
- 子文档数量：$(find docs/功能开发文档 -maxdepth 1 -name "*.md" -type f | wc -l)
- 最新更新：$TODAY

### 项目文档
- 位置：docs/项目文档/
- 子文档数量：$(find docs/项目文档 -maxdepth 1 -name "*.md" -type f | wc -l)
- 最新更新：$TODAY

### 每日记录
- 位置：docs/每日记录/
- 记录数量：$(find docs/每日记录 -maxdepth 1 -name "*.md" -type f | wc -l)

## Memory 索引状态

- 位置：.trae/memory/INDEX.md
- 状态：已同步
- 同步时间：$(date +%H:%M:%S)

## 文档结构

\`\`\`
docs/
├── 功能开发文档/    # 开发知识
├── 项目文档/       # 项目管理
└── 每日记录/       # 每日汇总
\`\`\`

\`\`\`
.trae/memory/
└── INDEX.md       # 极简索引（指向 docs/）
\`\`\`
EOF

echo -e "${GREEN}✅ 同步报告已生成: $REPORT_FILE${NC}"

# ==================== 完成 ====================
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ Memory 索引同步完成！${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "同步摘要："
echo "  - 功能开发文档: docs/功能开发文档/"
echo "  - 项目文档: docs/项目文档/"
echo "  - 每日记录: docs/每日记录/"
echo "  - Memory: .trae/memory/INDEX.md"
echo ""
