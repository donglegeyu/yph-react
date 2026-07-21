package com.material.server.controller;

import com.material.server.common.BusinessException;
import com.material.server.common.Result;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.Pattern;

/**
 * 元数据 - 动态选项查询接口
 * 用于页面生成器中 tableRef 类型字段加载选项
 *
 * 安全：
 * 1. table/labelKey/valueKey 必须符合标识符白名单（防 SQL 注入）
 * 2. filter 仅支持 field=value 形式（字段名也走白名单）
 * 3. 强制 LIMIT 100，避免全表扫描
 */
@Slf4j
@RestController
@RequestMapping("/api/meta")
@RequiredArgsConstructor
public class MetaOptionsController {

    private final JdbcTemplate jdbcTemplate;

    private static final Pattern IDENTIFIER_PATTERN =
            Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]{0,63}$");

    @GetMapping("/options")
    public Result<List<Map<String, Object>>> options(
            @RequestParam String table,
            @RequestParam String labelKey,
            @RequestParam String valueKey,
            @RequestParam(required = false) String filter,
            @RequestParam(defaultValue = "100") Integer limit) {

        // 白名单校验
        validateIdentifier("table", table);
        validateIdentifier("labelKey", labelKey);
        validateIdentifier("valueKey", valueKey);

        // 强制 LIMIT 边界
        int safeLimit = Math.max(1, Math.min(limit, 500));

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ");
        sql.append(valueKey).append(" AS `value`, ");
        sql.append(labelKey).append(" AS `label` ");
        sql.append("FROM `").append(table).append("`");

        List<Object> params = new ArrayList<>();
        if (filter != null && !filter.trim().isEmpty()) {
            String where = parseFilterToWhere(filter, params);
            if (where != null) {
                sql.append(" WHERE ").append(where);
            }
        }
        sql.append(" LIMIT ").append(safeLimit);

        List<Map<String, Object>> list = jdbcTemplate.queryForList(
                sql.toString(), params.toArray());

        return Result.success(list);
    }

    /**
     * 解析 filter 字符串为 SQL WHERE 子句
     * 仅支持: field1=v1,field2=v2 形式
     * 字段名走白名单，值用占位符
     */
    private String parseFilterToWhere(String filter, List<Object> params) {
        String[] parts = filter.split(",");
        List<String> conditions = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) continue;
            int eq = trimmed.indexOf('=');
            if (eq <= 0) continue;
            String field = trimmed.substring(0, eq).trim();
            String value = trimmed.substring(eq + 1).trim();
            validateIdentifier("filter." + field, field);
            conditions.add(field + " = ?");
            params.add(value);
        }
        if (conditions.isEmpty()) return null;
        return String.join(" AND ", conditions);
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
