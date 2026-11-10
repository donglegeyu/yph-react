package com.material.server.service.impl;

import com.material.server.common.BusinessException;
import com.material.server.common.PageResult;
import com.material.server.dto.DynamicQueryParam;
import com.material.server.service.DynamicQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 动态查询服务实现
 *
 * 安全防护（6 层）：
 * 1. 标识符白名单：table/select/filter.field/orderBy.field 必须匹配 ^[a-zA-Z_][a-zA-Z0-9_]{0,63}$
 * 2. 值永远用 ? 占位符，依赖 PreparedStatement 转义
 * 3. 操作符枚举白名单：op 必须 ∈ ALLOWED_OPS，switch(op) 映射固定 SQL 片段
 * 4. 强制分页边界：size ∈ [1, 200]，offset = (current-1) * size
 * 5. orderBy 方向白名单：dir ∈ {ASC, DESC}
 * 6. 表存在性二次校验：查 information_schema 验证表真实存在
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DynamicQueryServiceImpl implements DynamicQueryService {

    private final JdbcTemplate jdbcTemplate;

    private static final Pattern IDENTIFIER_PATTERN =
            Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]{0,63}$");

    private static final Set<String> ALLOWED_OPS = Set.of(
            "eq", "ne", "like", "ll", "rl",
            "gt", "gte", "lt", "lte",
            "in", "between", "null", "notnull"
    );

    private static final int MAX_SIZE = 200;

    @Override
    public PageResult<Map<String, Object>> query(DynamicQueryParam param) {
        validateAndNormalize(param);

        // 校验表真实存在（防查不存在的表导致 500）
        validateTableExists(param.getTable());

        List<Object> params = new ArrayList<>();

        // 构建 SELECT 子句
        String selectClause = buildSelectClause(param.getSelect());

        // 构建 WHERE 子句
        String whereClause = buildWhereClause(param.getFilter(), params);

        // 表有 deleted 列时自动过滤已逻辑删除的记录（页面生成器建的表默认带 deleted）
        if (hasDeletedColumn(param.getTable())) {
            whereClause = whereClause == null
                    ? "`deleted` = 0"
                    : whereClause + " AND `deleted` = 0";
        }

        // 构建 ORDER BY 子句
        String orderByClause = buildOrderByClause(param.getOrderBy());

        // 查总数
        long total = countTotal(param.getTable(), whereClause, params);

        // 查分页数据
        int current = param.getCurrent();
        int size = param.getSize();
        int offset = (current - 1) * size;

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ").append(selectClause);
        sql.append(" FROM `").append(param.getTable()).append("`");
        if (whereClause != null) {
            sql.append(" WHERE ").append(whereClause);
        }
        if (orderByClause != null) {
            sql.append(" ORDER BY ").append(orderByClause);
        }
        sql.append(" LIMIT ").append(size).append(" OFFSET ").append(offset);

        List<Map<String, Object>> records = jdbcTemplate.queryForList(
                sql.toString(), params.toArray());

        return PageResult.of(records, total, current, size);
    }

    private void validateAndNormalize(DynamicQueryParam param) {
        if (param == null) {
            throw new BusinessException("查询参数不能为空");
        }
        validateIdentifier("table", param.getTable());

        int current = param.getCurrent() == null ? 1 : Math.max(1, param.getCurrent());
        int size = param.getSize() == null ? 20 : Math.max(1, Math.min(param.getSize(), MAX_SIZE));
        param.setCurrent(current);
        param.setSize(size);
    }

    private void validateTableExists(String table) {
        Integer cnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.TABLES " +
                        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                Integer.class, table);
        if (cnt == null || cnt == 0) {
            throw new BusinessException("表不存在：" + table);
        }
    }

    /** 表是否有 deleted 列（有则查询时自动过滤逻辑删除记录） */
    private boolean hasDeletedColumn(String table) {
        Integer cnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'deleted'",
                Integer.class, table);
        return cnt != null && cnt > 0;
    }

    private String buildSelectClause(String select) {
        if (select == null || select.trim().isEmpty()) {
            return "*";
        }
        String[] cols = select.split(",");
        List<String> safe = new ArrayList<>();
        for (String col : cols) {
            String trimmed = col.trim();
            if (trimmed.isEmpty()) continue;
            validateIdentifier("select." + trimmed, trimmed);
            safe.add("`" + trimmed + "`");
        }
        if (safe.isEmpty()) return "*";
        return String.join(", ", safe);
    }

    private String buildWhereClause(String filter, List<Object> params) {
        if (filter == null || filter.trim().isEmpty()) return null;

        String[] parts = filter.split(",");
        List<String> conditions = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) continue;

            String[] seg = trimmed.split(":", 3);
            if (seg.length < 2) continue;

            String field = seg[0].trim();
            String op = seg[1].trim().toLowerCase();
            String value = seg.length == 3 ? seg[2] : null;

            validateIdentifier("filter." + field, field);
            if (!ALLOWED_OPS.contains(op)) {
                throw new BusinessException("非法的操作符：" + op);
            }

            String condition = buildCondition(field, op, value, params);
            if (condition != null) {
                conditions.add(condition);
            }
        }
        if (conditions.isEmpty()) return null;
        return String.join(" AND ", conditions);
    }

    private String buildCondition(String field, String op, String value, List<Object> params) {
        switch (op) {
            case "eq":
                if (value == null || value.isEmpty()) return null;
                params.add(value);
                return "`" + field + "` = ?";
            case "ne":
                if (value == null || value.isEmpty()) return null;
                params.add(value);
                return "`" + field + "` != ?";
            case "like":
                if (value == null || value.isEmpty()) return null;
                params.add("%" + value + "%");
                return "`" + field + "` LIKE ?";
            case "ll":
                if (value == null || value.isEmpty()) return null;
                params.add("%" + value);
                return "`" + field + "` LIKE ?";
            case "rl":
                if (value == null || value.isEmpty()) return null;
                params.add(value + "%");
                return "`" + field + "` LIKE ?";
            case "gt":
                if (value == null || value.isEmpty()) return null;
                params.add(value);
                return "`" + field + "` > ?";
            case "gte":
                if (value == null || value.isEmpty()) return null;
                params.add(value);
                return "`" + field + "` >= ?";
            case "lt":
                if (value == null || value.isEmpty()) return null;
                params.add(value);
                return "`" + field + "` < ?";
            case "lte":
                if (value == null || value.isEmpty()) return null;
                params.add(value);
                return "`" + field + "` <= ?";
            case "in":
                if (value == null || value.isEmpty()) return null;
                String[] vals = value.split("\\|");
                List<String> placeholders = new ArrayList<>();
                for (String v : vals) {
                    String trimmed = v.trim();
                    if (trimmed.isEmpty()) continue;
                    placeholders.add("?");
                    params.add(trimmed);
                }
                if (placeholders.isEmpty()) return null;
                return "`" + field + "` IN (" + String.join(", ", placeholders) + ")";
            case "between":
                // 值格式：v1|v2（如日期范围 2026-01-01|2026-01-31）
                if (value == null || value.isEmpty()) return null;
                String[] range = value.split("\\|");
                String from = range.length > 0 ? range[0].trim() : "";
                String to = range.length > 1 ? range[1].trim() : "";
                if (from.isEmpty() && to.isEmpty()) return null;
                // 只有单边界时退化为 gte / lte
                if (from.isEmpty()) {
                    params.add(to);
                    return "`" + field + "` <= ?";
                }
                if (to.isEmpty()) {
                    params.add(from);
                    return "`" + field + "` >= ?";
                }
                params.add(from);
                params.add(to);
                return "`" + field + "` BETWEEN ? AND ?";
            case "null":
                return "`" + field + "` IS NULL";
            case "notnull":
                return "`" + field + "` IS NOT NULL";
            default:
                return null;
        }
    }

    private String buildOrderByClause(String orderBy) {
        if (orderBy == null || orderBy.trim().isEmpty()) return null;
        String[] seg = orderBy.split(":");
        if (seg.length < 1) return null;
        String field = seg[0].trim();
        String dir = seg.length > 1 ? seg[1].trim().toLowerCase() : "desc";
        validateIdentifier("orderBy." + field, field);
        if (!"asc".equals(dir) && !"desc".equals(dir)) {
            throw new BusinessException("orderBy 方向必须是 asc 或 desc");
        }
        return "`" + field + "` " + dir.toUpperCase();
    }

    private long countTotal(String table, String whereClause, List<Object> params) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT COUNT(*) FROM `").append(table).append("`");
        if (whereClause != null) {
            sql.append(" WHERE ").append(whereClause);
        }
        Long total = jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
        return total == null ? 0 : total;
    }

    private void validateIdentifier(String name, String value) {
        if (value == null || value.isEmpty()) {
            throw new BusinessException(name + " 不能为空");
        }
        if (!IDENTIFIER_PATTERN.matcher(value).matches()) {
            throw new BusinessException(name + " 非法：" + value);
        }
    }
}
