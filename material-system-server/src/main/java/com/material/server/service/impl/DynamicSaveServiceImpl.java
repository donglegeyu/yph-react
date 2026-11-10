package com.material.server.service.impl;

import com.material.server.common.BusinessException;
import com.material.server.dto.DynamicSaveParam;
import com.material.server.service.DynamicSaveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 动态数据写服务实现
 *
 * 安全防护（与 DynamicQueryServiceImpl 同一套防线 + 写侧增强）：
 * 1. 标识符白名单：table / data.key 必须匹配 ^[a-zA-Z_][a-zA-Z0-9_]{0,63}$
 * 2. 值永远用 ? 占位符，依赖 PreparedStatement 转义
 * 3. 表存在性校验（information_schema）
 * 4. 列白名单：data.key 必须是表中真实存在的列（查 information_schema.COLUMNS）
 *    且禁止写 id / create_time / update_time / create_by / update_by / deleted 等系统列
 * 5. 日期值宽松归一化：ISO 字符串（含 T / Z / 毫秒）转 MySQL 可接受的格式
 * 6. 删除：表有 deleted 列走逻辑删除（UPDATE deleted=1），否则物理删除
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DynamicSaveServiceImpl implements DynamicSaveService {

    private final JdbcTemplate jdbcTemplate;

    private static final Pattern IDENTIFIER_PATTERN =
            Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]{0,63}$");

    /** 禁止通过写接口修改的系统列（create_by/update_by 由服务端按 operator 写入，防伪造） */
    private static final Set<String> FORBIDDEN_COLUMNS = Set.of(
            "id", "create_time", "update_time", "deleted", "create_by", "update_by"
    );

    /** 日期/时间类列类型（information_schema.DATA_TYPE） */
    private static final Set<String> DATETIME_TYPES = Set.of(
            "date", "datetime", "timestamp", "time"
    );

    @Override
    public Long save(DynamicSaveParam param) {
        if (param == null) {
            throw new BusinessException("保存参数不能为空");
        }
        String table = requireIdentifier("table", param.getTable());
        if (param.getData() == null || param.getData().isEmpty()) {
            throw new BusinessException("保存数据不能为空");
        }

        validateTableExists(table);
        Map<String, String> columnTypes = loadColumnTypes(table);

        // 过滤 + 归一化业务列值
        Map<String, Object> safeData = normalizeData(param.getData(), columnTypes);
        if (safeData.isEmpty()) {
            throw new BusinessException("没有可保存的业务字段");
        }

        if (param.getId() == null) {
            return insert(table, safeData, param.getOperator(), columnTypes);
        }
        return update(table, param.getId(), safeData, param.getOperator(), columnTypes);
    }

    @Override
    public void delete(String table, Long id, String operator) {
        String safeTable = requireIdentifier("table", table);
        if (id == null) {
            throw new BusinessException("删除必须指定 id");
        }
        validateTableExists(safeTable);
        Map<String, String> columnTypes = loadColumnTypes(safeTable);

        if (columnTypes.containsKey("deleted")) {
            // 逻辑删除
            List<Object> params = new ArrayList<>();
            String sql = "UPDATE `" + safeTable + "` SET `deleted` = 1";
            if (columnTypes.containsKey("update_by")) {
                sql += ", `update_by` = ?";
                params.add(operator);
            }
            sql += " WHERE `id` = ?";
            params.add(id);
            int rows = jdbcTemplate.update(sql, params.toArray());
            if (rows == 0) {
                throw new BusinessException("记录不存在或已删除：" + id);
            }
        } else {
            // 物理删除
            int rows = jdbcTemplate.update(
                    "DELETE FROM `" + safeTable + "` WHERE `id` = ?", id);
            if (rows == 0) {
                throw new BusinessException("记录不存在：" + id);
            }
        }
    }

    // --------------------------------------------------------------- INSERT

    private Long insert(String table, Map<String, Object> data,
                        String operator, Map<String, String> columnTypes) {
        // 自动填充创建人
        if (operator != null && !operator.isBlank()
                && columnTypes.containsKey("create_by") && !data.containsKey("create_by")) {
            data.put("create_by", operator.trim());
        }

        List<String> cols = new ArrayList<>(data.keySet());
        List<Object> params = new ArrayList<>(data.values());

        String colSql = String.join(", ", cols.stream().map(c -> "`" + c + "`").toList());
        String placeholderSql = String.join(", ", cols.stream().map(c -> "?").toList());
        String sql = "INSERT INTO `" + table + "` (" + colSql + ") VALUES (" + placeholderSql + ")";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        return key != null ? key.longValue() : null;
    }

    // --------------------------------------------------------------- UPDATE

    private Long update(String table, Long id, Map<String, Object> data,
                        String operator, Map<String, String> columnTypes) {
        // 自动填充更新人
        if (operator != null && !operator.isBlank()
                && columnTypes.containsKey("update_by") && !data.containsKey("update_by")) {
            data.put("update_by", operator.trim());
        }

        List<String> setClauses = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        for (Map.Entry<String, Object> e : data.entrySet()) {
            setClauses.add("`" + e.getKey() + "` = ?");
            params.add(e.getValue());
        }
        params.add(id);

        String sql = "UPDATE `" + table + "` SET " + String.join(", ", setClauses) + " WHERE `id` = ?";
        int rows = jdbcTemplate.update(sql, params.toArray());
        if (rows == 0) {
            throw new BusinessException("记录不存在：" + id);
        }
        return id;
    }

    // --------------------------------------------------------------- 校验与归一化

    private Map<String, Object> normalizeData(Map<String, Object> data,
                                              Map<String, String> columnTypes) {
        Map<String, Object> safe = new HashMap<>();
        for (Map.Entry<String, Object> e : data.entrySet()) {
            String col = requireIdentifier("data." + e.getKey(), e.getKey());
            if (FORBIDDEN_COLUMNS.contains(col)) {
                continue; // 系统列直接忽略（不报错，前端可能带上）
            }
            if (!columnTypes.containsKey(col)) {
                throw new BusinessException("字段不存在：" + col);
            }
            Object value = normalizeValue(e.getValue(), columnTypes.get(col));
            if (value != null) {
                safe.put(col, value);
            }
        }
        return safe;
    }

    /**
     * 值归一化：
     * - null / 空字符串 → null（跳过，让数据库默认值生效）
     * - Collection（多选）→ 逗号 join 字符串
     * - 日期/时间列的字符串值：ISO 格式（2026-01-01T10:00:00.000Z）→ MySQL 格式
     */
    private Object normalizeValue(Object value, String columnType) {
        if (value == null) return null;
        if (value instanceof String s) {
            if (s.trim().isEmpty()) return null;
            return DATETIME_TYPES.contains(columnType) ? normalizeDatetime(s) : s.trim();
        }
        if (value instanceof Collection<?> c) {
            List<String> parts = c.stream()
                    .filter(v -> v != null && !String.valueOf(v).trim().isEmpty())
                    .map(String::valueOf)
                    .toList();
            return parts.isEmpty() ? null : String.join(",", parts);
        }
        if (value instanceof Boolean || value instanceof Number) {
            return value;
        }
        return String.valueOf(value);
    }

    /** ISO 日期字符串 → MySQL 可接受格式（去 T、去 Z、截毫秒） */
    private String normalizeDatetime(String s) {
        String v = s.trim().replace('T', ' ');
        if (v.endsWith("Z")) {
            v = v.substring(0, v.length() - 1);
        }
        int dot = v.indexOf('.');
        if (dot > 0) {
            v = v.substring(0, dot);
        }
        return v;
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

    /** 查表的真实列名 → 列类型（DATA_TYPE） */
    private Map<String, String> loadColumnTypes(String table) {
        Map<String, String> types = new HashMap<>();
        jdbcTemplate.query(
                "SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS " +
                        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                rs -> {
                    types.put(rs.getString(1), rs.getString(2));
                },
                table);
        return types;
    }

    private String requireIdentifier(String name, String value) {
        if (value == null || value.isEmpty()) {
            throw new BusinessException(name + " 不能为空");
        }
        if (!IDENTIFIER_PATTERN.matcher(value).matches()) {
            throw new BusinessException(name + " 非法：" + value);
        }
        return value;
    }
}
