#!/bin/bash

# 每日记录同步脚本
# 将 memory/ 中的每日记录同步到 docs/每日记录/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 源目录
MEMORY_DIR="$PROJECT_ROOT/memory"
# 目标目录
DAILY_RECORD_DIR="$PROJECT_ROOT/docs/每日记录"

echo "========================================="
echo "每日记录同步脚本"
echo "========================================="
echo ""

# 检查源目录
if [ ! -d "$MEMORY_DIR" ]; then
  echo "❌ 错误：源目录不存在: $MEMORY_DIR"
  exit 1
fi

# 检查目标目录
if [ ! -d "$DAILY_RECORD_DIR" ]; then
  echo "📁 创建目标目录: $DAILY_RECORD_DIR"
  mkdir -p "$DAILY_RECORD_DIR"
fi

# 查找需要同步的文件
echo "🔍 查找每日记录..."
DAILY_FILES=$(find "$MEMORY_DIR" -maxdepth 1 -name "????-??-??.md" -type f 2>/dev/null | sort)

if [ -z "$DAILY_FILES" ]; then
  echo "ℹ️  没有找到每日记录文件"
  exit 0
fi

SYNC_COUNT=0
for file in $DAILY_FILES; do
  filename=$(basename "$file")

  # 检查目标目录中是否已存在
  if [ -f "$DAILY_RECORD_DIR/$filename" ]; then
    echo "⏭️  跳过（已存在）: $filename"
  else
    echo "📤 同步: $filename"
    cp "$file" "$DAILY_RECORD_DIR/"
    SYNC_COUNT=$((SYNC_COUNT + 1))
  fi
done

echo ""
echo "========================================="
echo "✅ 同步完成！"
echo "   新增文件: $SYNC_COUNT 个"
echo "========================================="

# 显示同步结果
echo ""
echo "📁 目标目录文件列表:"
ls -lh "$DAILY_RECORD_DIR" | tail -n +2 | head -10

if [ $(ls -1 "$DAILY_RECORD_DIR" | wc -l) -gt 10 ]; then
  echo "   ... 还有 $(($(ls -1 "$DAILY_RECORD_DIR" | wc -l) - 10)) 个文件"
fi
