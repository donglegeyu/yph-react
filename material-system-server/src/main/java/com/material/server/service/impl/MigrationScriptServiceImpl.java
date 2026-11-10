package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.common.BusinessException;
import com.material.server.dto.PageDefinitionDTO;
import com.material.server.dto.PublishResultDTO;
import com.material.server.dto.ReadyCheckDTO;
import com.material.server.entity.PageDefinition;
import com.material.server.entity.PageMigrationScript;
import com.material.server.mapper.PageDefinitionMapper;
import com.material.server.mapper.PageMigrationScriptMapper;
import com.material.server.service.MigrationScriptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 建表迁移脚本服务实现
 *
 * 安全边界：
 * - 只拼接「脚本文本」返回/存档，绝不通过 JdbcTemplate 执行任何 DDL
 * - 对 information_schema 只做 SELECT（读元数据），不做任何变更
 * - 表名/列名全部走标识符白名单校验（与 DynamicQueryService 同一规则）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MigrationScriptServiceImpl implements MigrationScriptService {

    private final JdbcTemplate jdbcTemplate;
    private final PageMigrationScriptMapper scriptMapper;
    private final PageDefinitionMapper pageDefinitionMapper;

    private static final Pattern IDENTIFIER_PATTERN =
            Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]{0,63}$");

    private static final Pattern VERSION_FILE_PATTERN = Pattern.compile("^V(\\d+)__");

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    @Transactional
    public PublishResultDTO generateForPublish(PageDefinition entity, PageDefinitionDTO dto, String operator) {
        String table = dto.getTableName();
        validateIdentifier("tableName", table);
        List<PageDefinitionDTO.FieldConfig> cols = collectDbColumns(dto);

        boolean newTable = Boolean.TRUE.equals(dto.getIsNewTable());

        // ---------- 绑定已有表：强校验列存在性，不生成脚本 ----------
        if (!newTable) {
            List<String> missing = findMissingColumns(table, cols);
            if (!missing.isEmpty()) {
                throw new BusinessException("绑定的数据表 `" + table + "` 缺少以下列："
                        + String.join("、", missing)
                        + "。请调整字段配置（或联系研发加列）后再发布");
            }
            return noScript("ready");
        }

        // ---------- 新表模式 ----------
        boolean exists = tableExists(table);

        if (!exists) {
            // 表不存在：生成 CREATE 脚本（可能是首次发布，也可能是上次脚本尚未入库）
            String content = buildCreateScript(entity, dto, cols);
            return saveScript(entity, content, "create", operator);
        }

        // 表已存在但不是本系统生成的：拒绝，防覆盖他人的表
        if (entity.getMigrationVersion() == null) {
            throw new BusinessException("数据表 `" + table + "` 已存在且不是由页面生成器创建。"
                    + "请改用「绑定已有表」模式，或更换表名");
        }

        // 表已存在（此前由脚本创建）：对比缺失列 → 生成 ALTER 加列脚本
        List<String> missing = findMissingColumns(table, cols);
        if (missing.isEmpty()) {
            return noScript("ready");
        }
        String content = buildAlterScript(entity, dto, cols, missing);
        return saveScript(entity, content, "alter", operator);
    }

    @Override
    @Transactional
    public ReadyCheckDTO checkReady(PageDefinition entity, PageDefinitionDTO dto) {
        String table = dto.getTableName();
        boolean exists = table != null && IDENTIFIER_PATTERN.matcher(table).matches() && tableExists(table);

        // 缺失列：表存在时对比 information_schema；表不存在时全部字段都算缺失
        List<String> missing = exists
                ? findMissingColumns(table, collectDbColumns(dto))
                : collectDbColumns(dto).stream()
                        .map(PageDefinitionDTO.FieldConfig::getDbColumn)
                        .collect(Collectors.toList());

        String status;
        if (exists && missing.isEmpty()) {
            status = "ready";
        } else if (entity.getMigrationVersion() != null) {
            status = "pending";
        } else {
            status = "not_generated";
        }

        entity.setMigrationStatus(status);
        pageDefinitionMapper.updateById(entity);

        ReadyCheckDTO result = new ReadyCheckDTO();
        result.setTableExists(exists);
        result.setStatus(status);
        result.setMissingColumns(missing);
        return result;
    }

    // ============= 内部：脚本生成 =============

    private PublishResultDTO noScript(String status) {
        PublishResultDTO r = new PublishResultDTO();
        r.setMigrationStatus(status);
        return r;
    }

    private PublishResultDTO saveScript(PageDefinition entity, String content, String type, String operator) {
        int version = nextVersion();
        String fileName = "V" + version + "__dynamic_" + entity.getPageKey() + "_" + type + ".sql";

        PageMigrationScript record = new PageMigrationScript();
        record.setPageDefinitionId(entity.getId());
        record.setPageKey(entity.getPageKey());
        record.setPageName(entity.getPageName());
        record.setVersion(version);
        record.setFileName(fileName);
        record.setScriptType(type);
        record.setContent(content);
        record.setCreateBy(operator);
        record.setCreateTime(LocalDateTime.now());
        scriptMapper.insert(record);

        log.info("迁移脚本已生成（不执行）：fileName={}, pageKey={}, type={}", fileName, entity.getPageKey(), type);

        PublishResultDTO r = new PublishResultDTO();
        r.setScriptId(record.getId());
        r.setScriptVersion(version);
        r.setFileName(fileName);
        r.setScriptType(type);
        r.setContent(content);
        r.setMigrationStatus("pending");
        return r;
    }

    /**
     * 下一个脚本版本号 = max(classpath 里 db/migration 的最大 V 号, 已存档脚本最大版本号) + 1
     */
    private int nextVersion() {
        int max = 0;
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            for (Resource r : resolver.getResources("classpath*:db/migration/V*.sql")) {
                String name = r.getFilename();
                if (name == null) continue;
                Matcher m = VERSION_FILE_PATTERN.matcher(name);
                if (m.find()) {
                    max = Math.max(max, Integer.parseInt(m.group(1)));
                }
            }
        } catch (Exception e) {
            log.warn("扫描 classpath 迁移脚本失败，仅按存档表计算版本号", e);
        }
        Long tableMax = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(version), 0) FROM page_migration_script", Long.class);
        if (tableMax != null) {
            max = Math.max(max, tableMax.intValue());
        }
        return max + 1;
    }

    private String buildCreateScript(PageDefinition entity, PageDefinitionDTO dto,
                                     List<PageDefinitionDTO.FieldConfig> cols) {
        String table = dto.getTableName();
        StringBuilder sb = new StringBuilder();
        sb.append("-- ============================================================\n");
        sb.append("-- 页面生成器自动生成，请勿手工修改内容\n");
        sb.append("-- 页面：").append(entity.getPageName())
                .append("（pageKey: ").append(entity.getPageKey()).append("）\n");
        sb.append("-- 生成时间：").append(LocalDateTime.now().format(TS)).append("\n");
        sb.append("-- 执行方式：放入 material-system-server/src/main/resources/db/migration/ 目录，\n");
        sb.append("--           由 Flyway 在后端启动时自动执行（系统本身不执行 DDL）\n");
        sb.append("-- ============================================================\n\n");
        sb.append("CREATE TABLE IF NOT EXISTS `").append(table).append("` (\n");
        sb.append("  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',\n");
        for (PageDefinitionDTO.FieldConfig f : cols) {
            sb.append("  `").append(f.getDbColumn()).append("` ").append(columnType(f))
                    .append(" DEFAULT NULL COMMENT '").append(escape(f.getFieldLabel())).append("',\n");
        }
        sb.append("  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
        sb.append("  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',\n");
        sb.append("  `create_by` VARCHAR(64) DEFAULT NULL COMMENT '创建人',\n");
        sb.append("  `update_by` VARCHAR(64) DEFAULT NULL COMMENT '更新人',\n");
        sb.append("  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-正常 1-已删除',\n");
        sb.append("  PRIMARY KEY (`id`)\n");
        sb.append(") ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '")
                .append(escape("页面生成器-" + entity.getPageName())).append("';\n");
        return sb.toString();
    }

    private String buildAlterScript(PageDefinition entity, PageDefinitionDTO dto,
                                    List<PageDefinitionDTO.FieldConfig> cols, List<String> missingColumns) {
        String table = dto.getTableName();
        Set<String> missing = new LinkedHashSet<>(missingColumns);

        StringBuilder sb = new StringBuilder();
        sb.append("-- ============================================================\n");
        sb.append("-- 页面生成器自动生成（新增列），请勿手工修改内容\n");
        sb.append("-- 页面：").append(entity.getPageName())
                .append("（pageKey: ").append(entity.getPageKey()).append("）\n");
        sb.append("-- 目标表：").append(table).append("\n");
        sb.append("-- 新增列：").append(String.join(", ", missing)).append("\n");
        sb.append("-- 幂等：列已存在时自动跳过\n");
        sb.append("-- ============================================================\n\n");

        for (PageDefinitionDTO.FieldConfig f : cols) {
            if (!missing.contains(f.getDbColumn())) continue;
            sb.append("SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS ")
                    .append("WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '").append(table)
                    .append("' AND COLUMN_NAME = '").append(f.getDbColumn()).append("');\n");
            sb.append("SET @ddl := IF(@col_exists = 0, 'ALTER TABLE `").append(table)
                    .append("` ADD COLUMN `").append(f.getDbColumn()).append("` ")
                    .append(columnType(f))
                    .append(" DEFAULT NULL COMMENT ''").append(escape(f.getFieldLabel())).append("''', 'SELECT 1');\n");
            sb.append("PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;\n\n");
        }
        return sb.toString();
    }

    // ============= 内部：元数据与校验 =============

    private boolean tableExists(String table) {
        Integer cnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.TABLES "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                Integer.class, table);
        return cnt != null && cnt > 0;
    }

    /** 找出配置中有 dbColumn 但数据库表中不存在的列 */
    private List<String> findMissingColumns(String table, List<PageDefinitionDTO.FieldConfig> cols) {
        if (cols.isEmpty()) {
            return new ArrayList<>();
        }
        List<Object> params = new ArrayList<>();
        params.add(table);
        StringBuilder in = new StringBuilder();
        for (PageDefinitionDTO.FieldConfig f : cols) {
            if (in.length() > 0) in.append(", ");
            in.append("?");
            params.add(f.getDbColumn());
        }
        // 查询表中实际存在的列（只读 information_schema，不做任何变更）
        List<String> existing = jdbcTemplate.queryForList(
                "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? "
                        + "AND COLUMN_NAME IN (" + in + ")",
                String.class, params.toArray());
        Set<String> existingSet = new java.util.HashSet<>(existing);
        return cols.stream()
                .map(PageDefinitionDTO.FieldConfig::getDbColumn)
                .filter(c -> !existingSet.contains(c))
                .collect(Collectors.toList());
    }

    /** 收集配置中需要落库的列（跳过操作列/无 dbColumn 的字段），并校验标识符合法性 */
    private List<PageDefinitionDTO.FieldConfig> collectDbColumns(PageDefinitionDTO dto) {
        List<PageDefinitionDTO.FieldConfig> result = new ArrayList<>();
        if (dto.getFields() == null) return result;
        Set<String> seen = new LinkedHashSet<>();
        for (PageDefinitionDTO.FieldConfig f : dto.getFields()) {
            if (Boolean.TRUE.equals(f.getIsAction())) continue;
            String col = f.getDbColumn();
            if (col == null || col.trim().isEmpty()) continue;
            col = col.trim();
            validateIdentifier("dbColumn(" + f.getFieldLabel() + ")", col);
            if (!seen.add(col)) continue; // 重复列只取第一个
            f.setDbColumn(col);
            result.add(f);
        }
        return result;
    }

    /** 字段 dbType → MySQL 列类型（DECIMAL 固定 18,2；VARCHAR 默认长度 128） */
    private String columnType(PageDefinitionDTO.FieldConfig f) {
        String type = f.getDbType() != null ? f.getDbType() : "VARCHAR";
        switch (type) {
            case "TEXT":
                return "TEXT";
            case "INT":
                return "INT";
            case "BIGINT":
                return "BIGINT";
            case "DECIMAL":
                return "DECIMAL(18,2)";
            case "DATETIME":
                return "DATETIME";
            case "DATE":
                return "DATE";
            case "VARCHAR":
            default:
                int len = f.getDbLength() != null && f.getDbLength() > 0 ? f.getDbLength() : 128;
                return "VARCHAR(" + len + ")";
        }
    }

    private String escape(String s) {
        return s == null ? "" : s.replace("'", "''");
    }

    private void validateIdentifier(String name, String value) {
        if (value == null || value.isEmpty()) {
            throw new BusinessException(name + " 不能为空");
        }
        if (!IDENTIFIER_PATTERN.matcher(value).matches()) {
            throw new BusinessException(name + " 非法（只允许字母数字下划线）：" + value);
        }
    }
}
