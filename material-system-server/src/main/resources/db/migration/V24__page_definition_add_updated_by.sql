-- ============================================================
-- V24__page_definition_add_updated_by.sql
-- 页面生成器：记录最近一次更新人（列表展示用）
-- ============================================================

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'page_definition' AND COLUMN_NAME = 'updated_by');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `page_definition` ADD COLUMN `updated_by` VARCHAR(50) DEFAULT NULL COMMENT ''最近更新人''',
  'SELECT ''already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
