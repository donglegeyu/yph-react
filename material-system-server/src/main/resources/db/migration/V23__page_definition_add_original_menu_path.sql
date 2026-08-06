-- ============================================================
-- V23__page_definition_add_original_menu_path.sql
-- 页面生成器：bind_existing 模式发布时会把菜单 path 改写为 /dynamic/{pageKey}
-- 为了删除时能还原，需要保存原 path
-- ============================================================

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'page_definition' AND COLUMN_NAME = 'original_menu_path');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `page_definition` ADD COLUMN `original_menu_path` VARCHAR(200) DEFAULT NULL COMMENT ''bind_existing 模式发布前的原菜单 path，删除时用于还原''',
  'SELECT ''already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
