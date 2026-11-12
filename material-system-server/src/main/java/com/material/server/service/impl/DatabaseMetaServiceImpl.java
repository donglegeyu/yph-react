package com.material.server.service.impl;

import com.material.server.common.BusinessException;
import com.material.server.dto.DbMetaColumnDTO;
import com.material.server.dto.DbMetaIndexDTO;
import com.material.server.dto.DbMetaRelationDTO;
import com.material.server.dto.DbMetaSummaryDTO;
import com.material.server.dto.DbMetaTableDTO;
import com.material.server.dto.DbMetaTableDetailDTO;
import com.material.server.service.DatabaseMetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 后端数据管理实现：全部通过 information_schema 只读查询，不拼接任何用户输入的表名。
 */
@Service
@RequiredArgsConstructor
public class DatabaseMetaServiceImpl implements DatabaseMetaService {

    private final JdbcTemplate jdbcTemplate;

    /** 关系缓存有效期（毫秒） */
    private static final long RELATION_CACHE_TTL = 60_000L;

    /** 分组展示顺序 */
    private static final List<String> GROUP_ORDER = List.of(
            "系统权限", "业务数据", "业务申请", "关联表", "视图与配置", "平台内部");

    /** 平台内部表：默认隐藏 */
    private static final Set<String> INTERNAL_TABLES = Set.of(
            "flyway_schema_history", "page_migration_script", "page_definition",
            "db_meta_table_meta", "db_meta_relation");

    /** 多对多关联表 */
    private static final Set<String> RELATION_TABLES = Set.of(
            "craftsman_brand", "craftsman_skill", "craftsman_certificate", "craftsman_service_area");

    /** 视图与配置类表 */
    private static final Set<String> VIEW_CONFIG_TABLES = Set.of(
            "craftsman_view", "material_view", "menu_view",
            "design_token", "design_token_category", "component_token",
            "icon_config", "user_preference", "favorite", "ai_model_config");

    /** 无法用前缀规则推导的字段，显式指定目标表 */
    private static final Map<String, String> COLUMN_TARGET_OVERRIDES = Map.of(
            "parent_menu_id", "nav_menu",
            "bind_menu_id", "nav_menu",
            "custom_parent_id", "nav_menu",
            "leader_user_id", "sys_user",
            "category_id", "design_token_category");

    /** 命名约定：字段前缀 -> 目标表 */
    private static final Map<String, String> PREFIX_TARGETS = Map.of(
            "user", "sys_user",
            "craftsman", "craftsman",
            "role", "sys_role",
            "domain", "sys_domain",
            "menu", "nav_menu",
            "dept", "sys_dept",
            "skill", "skill",
            "page_definition", "page_definition");

    private volatile List<DbMetaRelationDTO> relationCache;
    private volatile long relationCacheTime;

    @Override
    public DbMetaSummaryDTO getSummary() {
        String schema = schema();
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
                Integer.class, schema);
        Integer columnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?",
                Integer.class, schema);
        Integer commentedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND COLUMN_COMMENT <> ''",
                Integer.class, schema);
        Integer fkCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
                Integer.class, schema);

        List<DbMetaRelationDTO> relations = getRelationsCached();
        int inferred = 0;
        int manual = 0;
        for (DbMetaRelationDTO relation : relations) {
            if ("convention".equals(relation.getSource())) {
                inferred++;
            } else if ("manual".equals(relation.getSource())) {
                manual++;
            }
        }

        int hidden = 0;
        for (DbMetaTableDTO table : listTables(null, true)) {
            if (table.isHidden()) {
                hidden++;
            }
        }

        DbMetaSummaryDTO summary = new DbMetaSummaryDTO();
        summary.setTableCount(tableCount == null ? 0 : tableCount);
        summary.setColumnCount(columnCount == null ? 0 : columnCount);
        summary.setCommentedColumnCount(commentedCount == null ? 0 : commentedCount);
        summary.setForeignKeyCount(fkCount == null ? 0 : fkCount);
        summary.setInferredRelationCount(inferred);
        summary.setManualRelationCount(manual);
        summary.setHiddenTableCount(hidden);
        if (summary.getColumnCount() > 0) {
            double rate = summary.getCommentedColumnCount() * 100.0 / summary.getColumnCount();
            summary.setCommentRate(Math.round(rate * 10) / 10.0);
        }
        return summary;
    }

    @Override
    public List<DbMetaTableDTO> listTables(String keyword, boolean includeHidden) {
        Map<String, TableMetaConfig> configs = loadTableMetaConfig();
        List<DbMetaTableDTO> result = new ArrayList<>();

        String sql = "SELECT t.TABLE_NAME AS tableName, t.TABLE_COMMENT AS tableComment, t.TABLE_ROWS AS rowCount, "
                + "(SELECT COUNT(*) FROM information_schema.COLUMNS c "
                + " WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME) AS columnCount "
                + "FROM information_schema.TABLES t "
                + "WHERE t.TABLE_SCHEMA = ? AND t.TABLE_TYPE = 'BASE TABLE' ORDER BY t.TABLE_NAME";

        String kw = keyword == null ? "" : keyword.trim().toLowerCase();
        for (Map<String, Object> row : jdbcTemplate.queryForList(sql, schema())) {
            String tableName = str(row.get("tableName"));
            String tableComment = str(row.get("tableComment"));
            TableMetaConfig config = configs.get(tableName);

            DbMetaTableDTO dto = new DbMetaTableDTO();
            dto.setTableName(tableName);
            dto.setTableComment(tableComment);

            boolean customName = config != null && notBlank(config.displayName);
            dto.setCustomDisplayName(customName);
            String displayName = customName ? config.displayName
                    : (notBlank(tableComment) ? tableComment : tableName);
            dto.setDisplayName(displayName);

            String group = config != null && notBlank(config.groupName)
                    ? config.groupName : defaultGroup(tableName);
            dto.setGroupName(group);

            dto.setHidden(config != null ? config.hidden : INTERNAL_TABLES.contains(tableName));
            dto.setColumnCount(toInt(row.get("columnCount")));
            dto.setRowCount(toLong(row.get("rowCount")));

            if (!includeHidden && dto.isHidden()) {
                continue;
            }
            if (!kw.isEmpty()
                    && !tableName.toLowerCase().contains(kw)
                    && !displayName.toLowerCase().contains(kw)
                    && !tableComment.toLowerCase().contains(kw)) {
                continue;
            }
            result.add(dto);
        }

        result.sort(Comparator
                .comparingInt((DbMetaTableDTO t) -> groupIndex(t.getGroupName()))
                .thenComparing(DbMetaTableDTO::getTableName));
        return result;
    }

    @Override
    public DbMetaTableDetailDTO getTableDetail(String tableName) {
        if (!notBlank(tableName)) {
            throw new IllegalArgumentException("表名不能为空");
        }
        DbMetaTableDTO table = listTables(null, true).stream()
                .filter(t -> t.getTableName().equals(tableName))
                .findFirst()
                .orElseThrow(() -> new BusinessException("表不存在：" + tableName));

        List<DbMetaRelationDTO> relations = getRelationsCached();
        Map<String, DbMetaRelationDTO> outgoingByColumn = new LinkedHashMap<>();
        List<DbMetaRelationDTO> outgoing = new ArrayList<>();
        List<DbMetaRelationDTO> incoming = new ArrayList<>();
        for (DbMetaRelationDTO relation : relations) {
            if (relation.getFromTable().equals(tableName)) {
                outgoing.add(relation);
                outgoingByColumn.putIfAbsent(relation.getFromColumn(), relation);
            }
            if (relation.getToTable().equals(tableName)) {
                incoming.add(relation);
            }
        }

        DbMetaTableDetailDTO detail = new DbMetaTableDetailDTO();
        detail.setTable(table);
        detail.setColumns(loadColumns(tableName, outgoingByColumn));
        detail.setIndexes(loadIndexes(tableName));
        detail.setOutgoing(outgoing);
        detail.setIncoming(incoming);
        return detail;
    }

    @Override
    public List<DbMetaRelationDTO> listRelations(String scope) {
        List<DbMetaRelationDTO> all = getRelationsCached();
        if (!notBlank(scope) || "all".equalsIgnoreCase(scope)) {
            return all;
        }
        Map<String, TableMetaConfig> configs = loadTableMetaConfig();
        List<DbMetaRelationDTO> filtered = new ArrayList<>();
        for (DbMetaRelationDTO relation : all) {
            if ("inferred".equalsIgnoreCase(scope) && "convention".equals(relation.getSource())) {
                filtered.add(relation);
            } else if ("manual".equalsIgnoreCase(scope) && "manual".equals(relation.getSource())) {
                filtered.add(relation);
            } else if ("core".equalsIgnoreCase(scope)
                    && "系统权限".equals(groupOf(relation.getFromTable(), configs))) {
                filtered.add(relation);
            }
        }
        return filtered;
    }

    @Override
    public void refreshCache() {
        relationCache = null;
    }

    // ------------------------------------------------------------------ 内部实现

    private List<DbMetaColumnDTO> loadColumns(String tableName, Map<String, DbMetaRelationDTO> relationByColumn) {
        String sql = "SELECT COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, DATA_TYPE AS dataType, "
                + "IS_NULLABLE AS isNullable, COLUMN_DEFAULT AS columnDefault, COLUMN_COMMENT AS columnComment, "
                + "COLUMN_KEY AS columnKey, EXTRA AS extra "
                + "FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? "
                + "ORDER BY ORDINAL_POSITION";
        List<DbMetaColumnDTO> columns = new ArrayList<>();
        for (Map<String, Object> row : jdbcTemplate.queryForList(sql, schema(), tableName)) {
            DbMetaColumnDTO dto = new DbMetaColumnDTO();
            String columnName = str(row.get("columnName"));
            dto.setColumnName(columnName);
            dto.setColumnType(str(row.get("columnType")));
            dto.setDataType(str(row.get("dataType")));
            dto.setNullable("YES".equals(str(row.get("isNullable"))));
            dto.setColumnDefault(str(row.get("columnDefault")));
            dto.setComment(str(row.get("columnComment")));
            dto.setPrimaryKey("PRI".equals(str(row.get("columnKey"))));
            dto.setExtra(str(row.get("extra")));

            DbMetaRelationDTO relation = relationByColumn.get(columnName);
            if (relation != null) {
                dto.setRelationTarget(relation.getToTable() + "." + relation.getToColumn());
                dto.setRelationSource(relation.getSource());
            }
            columns.add(dto);
        }
        return columns;
    }

    private List<DbMetaIndexDTO> loadIndexes(String tableName) {
        String sql = "SELECT INDEX_NAME AS indexName, NON_UNIQUE AS nonUnique, SEQ_IN_INDEX AS seqInIndex, "
                + "COLUMN_NAME AS columnName FROM information_schema.STATISTICS "
                + "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY INDEX_NAME, SEQ_IN_INDEX";
        Map<String, DbMetaIndexDTO> grouped = new LinkedHashMap<>();
        for (Map<String, Object> row : jdbcTemplate.queryForList(sql, schema(), tableName)) {
            String indexName = str(row.get("indexName"));
            DbMetaIndexDTO dto = grouped.computeIfAbsent(indexName, name -> {
                DbMetaIndexDTO item = new DbMetaIndexDTO();
                item.setIndexName(name);
                item.setPrimary("PRIMARY".equals(name));
                item.setColumns(new ArrayList<>());
                return item;
            });
            dto.setUnique(toInt(row.get("nonUnique")) == 0);
            dto.getColumns().add(str(row.get("columnName")));
        }
        List<DbMetaIndexDTO> indexes = new ArrayList<>(grouped.values());
        indexes.sort(Comparator.comparing(DbMetaIndexDTO::isPrimary).reversed()
                .thenComparing(DbMetaIndexDTO::getIndexName));
        return indexes;
    }

    /**
     * 关系来源三层：真实外键 > 人工配置 > 命名约定推断。
     * 人工配置 enabled=0 时用于抑制同名推断关系。
     */
    private List<DbMetaRelationDTO> getRelationsCached() {
        long now = System.currentTimeMillis();
        if (relationCache == null || now - relationCacheTime > RELATION_CACHE_TTL) {
            synchronized (this) {
                if (relationCache == null || now - relationCacheTime > RELATION_CACHE_TTL) {
                    relationCache = buildRelations();
                    relationCacheTime = System.currentTimeMillis();
                }
            }
        }
        return relationCache;
    }

    private List<DbMetaRelationDTO> buildRelations() {
        String schema = schema();
        List<Map<String, Object>> tableRows = jdbcTemplate.queryForList(
                "SELECT TABLE_NAME AS tableName, TABLE_COMMENT AS tableComment FROM information_schema.TABLES "
                        + "WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'", schema);
        Map<String, String> tableLabels = new LinkedHashMap<>();
        for (Map<String, Object> row : tableRows) {
            String name = str(row.get("tableName"));
            String comment = str(row.get("tableComment"));
            tableLabels.put(name, notBlank(comment) ? comment : name);
        }

        List<Map<String, Object>> columnRows = jdbcTemplate.queryForList(
                "SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, DATA_TYPE AS dataType, "
                        + "COLUMN_COMMENT AS columnComment FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?", schema);
        Map<String, Map<String, String>> tableColumns = new LinkedHashMap<>();
        Map<String, String> columnComments = new LinkedHashMap<>();
        for (Map<String, Object> row : columnRows) {
            String table = str(row.get("tableName"));
            String column = str(row.get("columnName"));
            tableColumns.computeIfAbsent(table, key -> new LinkedHashMap<>()).put(column, str(row.get("dataType")));
            columnComments.put(table + "." + column, str(row.get("columnComment")));
        }

        Map<String, DbMetaRelationDTO> edges = new LinkedHashMap<>();

        // 1. 命名约定推断
        for (Map.Entry<String, Map<String, String>> tableEntry : tableColumns.entrySet()) {
            String fromTable = tableEntry.getKey();
            for (Map.Entry<String, String> columnEntry : tableEntry.getValue().entrySet()) {
                String column = columnEntry.getKey();
                if (!column.endsWith("_id") || "id".equals(column)) {
                    continue;
                }
                String target = resolveTargetTable(fromTable, column);
                if (target == null || !tableColumns.containsKey(target)) {
                    continue;
                }
                String targetType = tableColumns.get(target).get("id");
                if (targetType == null || !typeCompatible(columnEntry.getValue(), targetType)) {
                    // 类型不一致（如 craftsman_view.user_id 为 varchar）视为非关联字段
                    continue;
                }
                String comment = columnComments.get(fromTable + "." + column);
                DbMetaRelationDTO edge = newRelation(fromTable, column, target, "convention",
                        "medium", comment, tableLabels);
                edges.put(edgeKey(edge), edge);
            }
        }

        // 2. 真实外键（覆盖推断）
        String fkSql = "SELECT TABLE_NAME AS fromTable, COLUMN_NAME AS fromColumn, "
                + "REFERENCED_TABLE_NAME AS toTable, REFERENCED_COLUMN_NAME AS toColumn "
                + "FROM information_schema.KEY_COLUMN_USAGE "
                + "WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL";
        for (Map<String, Object> row : jdbcTemplate.queryForList(fkSql, schema)) {
            String fromTable = str(row.get("fromTable"));
            String fromColumn = str(row.get("fromColumn"));
            String toTable = str(row.get("toTable"));
            String toColumn = str(row.get("toColumn"));
            DbMetaRelationDTO edge = newRelation(fromTable, fromColumn, toTable, "fk", "high",
                    columnComments.get(fromTable + "." + fromColumn), tableLabels);
            edge.setToColumn(toColumn);
            edges.put(edgeKey(edge), edge);
        }

        // 3. 人工配置（enabled=1 补充/覆盖，enabled=0 抑制）
        String manualSql = "SELECT from_table AS fromTable, from_column AS fromColumn, to_table AS toTable, "
                + "to_column AS toColumn, relation_type AS relationType, relation_label AS label, enabled "
                + "FROM db_meta_relation";
        for (Map<String, Object> row : jdbcTemplate.queryForList(manualSql)) {
            String fromTable = str(row.get("fromTable"));
            String fromColumn = str(row.get("fromColumn"));
            String toTable = str(row.get("toTable"));
            String toColumn = str(row.get("toColumn"));
            String key = fromTable + "|" + fromColumn + "|" + toTable + "|" + toColumn;
            if (toInt(row.get("enabled")) == 0) {
                edges.remove(key);
                continue;
            }
            DbMetaRelationDTO edge = newRelation(fromTable, fromColumn, toTable, "manual", "high",
                    str(row.get("label")), tableLabels);
            edge.setToColumn(notBlank(toColumn) ? toColumn : "id");
            String relationType = str(row.get("relationType"));
            if (notBlank(relationType)) {
                edge.setRelationType(relationType);
            }
            edges.put(key, edge);
        }

        List<DbMetaRelationDTO> result = new ArrayList<>(edges.values());
        result.sort(Comparator.comparing(DbMetaRelationDTO::getFromTable)
                .thenComparing(DbMetaRelationDTO::getFromColumn)
                .thenComparing(DbMetaRelationDTO::getToTable));
        return result;
    }

    private DbMetaRelationDTO newRelation(String fromTable, String fromColumn, String toTable,
                                          String source, String confidence, String label,
                                          Map<String, String> tableLabels) {
        DbMetaRelationDTO edge = new DbMetaRelationDTO();
        edge.setFromTable(fromTable);
        edge.setFromColumn(fromColumn);
        edge.setToTable(toTable);
        edge.setToColumn("id");
        edge.setSource(source);
        edge.setConfidence(confidence);
        edge.setRelationType(fromTable.equals(toTable) ? "self_reference" : "many_to_one");
        edge.setLabel(label);
        edge.setFromTableLabel(tableLabels.getOrDefault(fromTable, fromTable));
        edge.setToTableLabel(tableLabels.getOrDefault(toTable, toTable));
        return edge;
    }

    private String edgeKey(DbMetaRelationDTO edge) {
        return edge.getFromTable() + "|" + edge.getFromColumn() + "|" + edge.getToTable() + "|" + edge.getToColumn();
    }

    private String resolveTargetTable(String tableName, String column) {
        String override = COLUMN_TARGET_OVERRIDES.get(column);
        if (override != null) {
            return override;
        }
        String base = column.substring(0, column.length() - 3);
        if ("parent".equals(base)) {
            return tableName;
        }
        String target = PREFIX_TARGETS.get(base);
        if (target != null) {
            return target;
        }
        int index = base.lastIndexOf('_');
        if (index > 0) {
            return PREFIX_TARGETS.get(base.substring(index + 1));
        }
        return null;
    }

    private boolean typeCompatible(String sourceType, String targetType) {
        return isNumericType(sourceType) == isNumericType(targetType);
    }

    private boolean isNumericType(String dataType) {
        if (dataType == null) {
            return false;
        }
        return switch (dataType.toLowerCase()) {
            case "bigint", "int", "integer", "smallint", "tinyint", "mediumint", "decimal", "numeric" -> true;
            default -> false;
        };
    }

    private String defaultGroup(String tableName) {
        if (INTERNAL_TABLES.contains(tableName)) {
            return "平台内部";
        }
        if (tableName.startsWith("sys_")) {
            return "系统权限";
        }
        if (tableName.endsWith("_application")) {
            return "业务申请";
        }
        if (RELATION_TABLES.contains(tableName)) {
            return "关联表";
        }
        if (VIEW_CONFIG_TABLES.contains(tableName)) {
            return "视图与配置";
        }
        return "业务数据";
    }

    private String groupOf(String tableName, Map<String, TableMetaConfig> configs) {
        TableMetaConfig config = configs.get(tableName);
        if (config != null && notBlank(config.groupName)) {
            return config.groupName;
        }
        return defaultGroup(tableName);
    }

    private int groupIndex(String groupName) {
        int index = GROUP_ORDER.indexOf(groupName);
        return index < 0 ? GROUP_ORDER.size() : index;
    }

    private Map<String, TableMetaConfig> loadTableMetaConfig() {
        String sql = "SELECT table_name AS tableName, display_name AS displayName, group_name AS groupName, "
                + "hidden AS hidden FROM db_meta_table_meta";
        Map<String, TableMetaConfig> configs = new LinkedHashMap<>();
        for (Map<String, Object> row : jdbcTemplate.queryForList(sql)) {
            TableMetaConfig config = new TableMetaConfig();
            config.displayName = str(row.get("displayName"));
            config.groupName = str(row.get("groupName"));
            config.hidden = toInt(row.get("hidden")) == 1;
            configs.put(str(row.get("tableName")), config);
        }
        return configs;
    }

    private String schema() {
        String schema = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
        if (!notBlank(schema)) {
            throw new BusinessException("无法获取当前数据库名");
        }
        return schema;
    }

    private static String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static int toInt(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    private static long toLong(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private static class TableMetaConfig {
        private String displayName;
        private String groupName;
        private boolean hidden;
    }
}
