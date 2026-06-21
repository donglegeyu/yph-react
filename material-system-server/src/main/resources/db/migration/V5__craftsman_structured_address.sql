-- ============================================================
-- V5__craftsman_structured_address.sql
-- 为工匠编辑功能新增结构化字段
-- - residential_area_code：省/市/区级联码（逗号分隔），用于编辑回填级联选择器
-- - residential_street：街道/乡镇
-- - residential_detail：详细地址
-- - id_card_valid_date：身份证有效期（开始,结束 或 开始,2099-12-31 表示长期）
-- 保留原 residential_address 拼接字段，用于详情页展示
-- ============================================================

SET @col1 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman' AND COLUMN_NAME = 'residential_area_code');
SET @sql1 = IF(@col1 = 0,
  'ALTER TABLE `craftsman` ADD COLUMN `residential_area_code` VARCHAR(100) DEFAULT NULL COMMENT ''常住地址省市区编码（逗号分隔）''',
  'SELECT ''residential_area_code already exists''');
PREPARE stmt1 FROM @sql1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

SET @col2 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman' AND COLUMN_NAME = 'residential_street');
SET @sql2 = IF(@col2 = 0,
  'ALTER TABLE `craftsman` ADD COLUMN `residential_street` VARCHAR(200) DEFAULT NULL COMMENT ''常住地址街道/乡镇''',
  'SELECT ''residential_street already exists''');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

SET @col3 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman' AND COLUMN_NAME = 'residential_detail');
SET @sql3 = IF(@col3 = 0,
  'ALTER TABLE `craftsman` ADD COLUMN `residential_detail` VARCHAR(500) DEFAULT NULL COMMENT ''常住地址详细地址''',
  'SELECT ''residential_detail already exists''');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @col4 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman' AND COLUMN_NAME = 'id_card_valid_date');
SET @sql4 = IF(@col4 = 0,
  'ALTER TABLE `craftsman` ADD COLUMN `id_card_valid_date` VARCHAR(50) DEFAULT NULL COMMENT ''身份证有效期（逗号分隔，结束为2099-12-31表示长期）''',
  'SELECT ''id_card_valid_date already exists''');
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

-- 回填：把已有的拼接地址补到结构化字段为空值（历史数据无法精确拆分，保持 NULL）
-- 新数据由 Service 层同时写入拼接字段和结构化字段

SELECT 'V5 craftsman structured address fields added' AS msg;
