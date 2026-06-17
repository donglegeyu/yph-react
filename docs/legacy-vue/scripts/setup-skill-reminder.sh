#!/bin/bash

# 设置 Skill 知识进化提醒
# 每周一 9:00 自动运行

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "设置 Skill 知识进化提醒"
echo "========================================="
echo ""

# 检查是否已有 crontab
CRON_LINE="0 9 * * 1 cd $PROJECT_ROOT && bash $SCRIPT_DIR/skill-review-reminder.sh >> ~/.skill-reminder.log 2>&1"

if crontab -l 2>/dev/null | grep -q "skill-review-reminder.sh"; then
  echo "⚠️  提醒已设置，无需重复设置"
  echo ""
  echo "当前 crontab:"
  crontab -l | grep skill
else
  echo "📅 正在设置每周一 9:00 提醒..."
  echo ""
  
  # 添加 crontab
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  
  echo "✅ 提醒设置成功！"
  echo ""
  echo "当前 crontab:"
  crontab -l | grep skill
fi

echo ""
echo "========================================="
echo "提示："
echo "- 提醒日志: ~/.skill-reminder.log"
echo "- 取消提醒: crontab -e 删除对应行"
echo "- 手动运行: ./scripts/skill-review-reminder.sh"
echo "========================================="
