-- ============================================================
-- V10__craftsman_add_service_record.sql
-- 补充 service_record 字段（服务记录图片URL，逗号分隔）
-- 历史问题：Entity 声明了 serviceRecord 字段，但 V5 漏加了这一列
-- 导致工匠列表/详情接口 500（Unknown column 'service_record'）
-- ============================================================

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman' AND COLUMN_NAME = 'service_record');
SET @sql = IF(@col = 0,
  'ALTER TABLE `craftsman` ADD COLUMN `service_record` VARCHAR(1000) DEFAULT NULL COMMENT ''服务记录（图片URL，逗号分隔）''',
  'SELECT ''service_record already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'V10 craftsman service_record column added' AS msg;
