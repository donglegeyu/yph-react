-- ============================================================
-- V6__craftsman_relations_add_deleted.sql
-- 给 4 张工匠关联表补 deleted 列，对齐 Entity 的 @TableLogic
-- 历史问题：V3 建表时未包含 deleted 列，导致 selectList/delete 报
--   "Unknown column 'deleted' in 'field list'"
-- ============================================================

-- craftsman_skill
SET @c1 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman_skill' AND COLUMN_NAME = 'deleted');
SET @s1 = IF(@c1 = 0,
  'ALTER TABLE `craftsman_skill` ADD COLUMN `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT ''逻辑删除''',
  'SELECT ''craftsman_skill.deleted already exists''');
PREPARE stmt1 FROM @s1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

-- craftsman_brand
SET @c2 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman_brand' AND COLUMN_NAME = 'deleted');
SET @s2 = IF(@c2 = 0,
  'ALTER TABLE `craftsman_brand` ADD COLUMN `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT ''逻辑删除''',
  'SELECT ''craftsman_brand.deleted already exists''');
PREPARE stmt2 FROM @s2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- craftsman_service_area
SET @c3 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman_service_area' AND COLUMN_NAME = 'deleted');
SET @s3 = IF(@c3 = 0,
  'ALTER TABLE `craftsman_service_area` ADD COLUMN `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT ''逻辑删除''',
  'SELECT ''craftsman_service_area.deleted already exists''');
PREPARE stmt3 FROM @s3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

-- craftsman_certificate
SET @c4 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'craftsman_certificate' AND COLUMN_NAME = 'deleted');
SET @s4 = IF(@c4 = 0,
  'ALTER TABLE `craftsman_certificate` ADD COLUMN `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT ''逻辑删除''',
  'SELECT ''craftsman_certificate.deleted already exists''');
PREPARE stmt4 FROM @s4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

SELECT 'V6 craftsman relations deleted column added' AS msg;
