-- ============================================================
-- V25__page_migration_infra.sql
-- 页面生成器「建表联动」基础设施：
--   1. page_definition 加迁移状态字段（migration_version / migration_status）
--   2. 新建 page_migration_script 表（保存系统生成的建表/加列脚本文本）
--
-- 注意：系统只生成脚本文本，永远不执行 DDL（项目红线）。
--       动态业务表由研发把脚本放入 db/migration/ 后由 Flyway 执行。
--
-- 写法说明：每个字段一段独立的 IF + PREPARE（与 V24 相同的保守写法）。
--   不要用 CONCAT 拼接多段 ALTER——Flyway 7.15 解析会报 1064 语法错误。
-- ============================================================

-- 1a. page_definition 加 migration_version 字段（幂等）
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'page_definition' AND COLUMN_NAME = 'migration_version');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `page_definition` ADD COLUMN `migration_version` INT DEFAULT NULL COMMENT ''最新建表脚本版本号''',
  'SELECT ''already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1b. page_definition 加 migration_status 字段（幂等）
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'page_definition' AND COLUMN_NAME = 'migration_status');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `page_definition` ADD COLUMN `migration_status` VARCHAR(20) NOT NULL DEFAULT ''not_generated'' COMMENT ''迁移状态：not_generated-未生成 pending-待入库 ready-已就绪''',
  'SELECT ''already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 脚本存档表
CREATE TABLE IF NOT EXISTS `page_migration_script` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `page_definition_id` BIGINT UNSIGNED NOT NULL COMMENT '页面定义 ID',
  `page_key` VARCHAR(100) NOT NULL COMMENT '页面 key',
  `page_name` VARCHAR(100) DEFAULT NULL COMMENT '页面名称',
  `version` INT NOT NULL COMMENT '脚本版本号（对应 V{version}）',
  `file_name` VARCHAR(150) NOT NULL COMMENT '建议文件名（V{version}__dynamic_{page_key}_{type}.sql）',
  `script_type` VARCHAR(20) NOT NULL DEFAULT 'create' COMMENT '脚本类型：create-建表 alter-加列',
  `content` LONGTEXT NOT NULL COMMENT '脚本文本内容（系统只生成不执行）',
  `create_by` VARCHAR(64) DEFAULT NULL COMMENT '创建人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT NULL COMMENT '更新人',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-正常 1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version_del` (`version`, `deleted`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '页面生成器迁移脚本存档';

SELECT 'V25 页面生成器建表联动基础设施完成' AS msg;
