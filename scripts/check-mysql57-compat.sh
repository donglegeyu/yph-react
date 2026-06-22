#!/usr/bin/env bash
# 检查 db/migration 下的 SQL 是否使用了 MySQL 8.0 专有语法
# 用法：bash scripts/check-mysql57-compat.sh
# 退出码：0 通过，1 发现不兼容语法

set -e

MIGRATION_DIR="material-system-server/src/main/resources/db/migration"
EXIT_CODE=0

echo "🔍 检查 Flyway 迁移脚本的 MySQL 5.7 兼容性..."
echo "目录: $MIGRATION_DIR"
echo ""

# MySQL 8.0 专有语法关键词（会触发 5.7 报错）
# 参考：https://dev.mysql.com/doc/refman/8.0/en/what-is.html
PATTERNS=(
    'CHECKSUM=[0-9]'
    'GENERATED ALWAYS'
    'JSON_TABLE'
    'GROUPING('
    'WITH RECURSIVE'
    'INTERSECT'
    'EXCEPT'
    'ROW_NUMBER()'
    'RANK()'
    'DENSE_RANK()'
    'NTILE('
    'LEAD('
    'LAG('
    'FIRST_VALUE('
    'LAST_VALUE('
    'NTH_VALUE('
    'JSON_PRETTY'
    'JSON_STORAGE'
    'JSON_MERGE_PATCH'
    'JSON_ARRAYAGG'
    'JSON_OBJECTAGG'
)

for file in "$MIGRATION_DIR"/*.sql; do
    [ -f "$file" ] || continue
    filename=$(basename "$file")
    
    for pattern in "${PATTERNS[@]}"; do
        if grep -iq "$pattern" "$file"; then
            echo "❌ $filename: 发现 MySQL 8.0 专有语法 → $pattern"
            grep -in "$pattern" "$file" | head -3
            EXIT_CODE=1
        fi
    done
done

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ 所有迁移脚本兼容 MySQL 5.7"
else
    echo ""
    echo "⚠️  发现不兼容语法！服务器是 MySQL 5.7，这些脚本会导致部署失败"
    echo "   参考：https://dev.mysql.com/doc/refman/5.7/en/what-is.html"
fi

exit $EXIT_CODE
