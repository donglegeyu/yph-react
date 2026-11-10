-- =============================================================
-- V27: 页面生成器「任务列表」页（ren-wu-lie-biao）schema 字段补齐
-- 该页面 schema 定义了 5 个业务字段，但历史建表只建了 2 列
-- （fu_ze_ren / kai_shi_shi_jian），补齐缺失 3 列（幂等）
-- =============================================================

-- 1. 任务名称 ren_wu_ming_cheng
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ren_wu_lie_biao'
    AND COLUMN_NAME = 'ren_wu_ming_cheng'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `ren_wu_lie_biao` ADD COLUMN `ren_wu_ming_cheng` varchar(255) DEFAULT NULL COMMENT ''任务名称'' AFTER `id`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 状态 zhuang_tai
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ren_wu_lie_biao'
    AND COLUMN_NAME = 'zhuang_tai'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `ren_wu_lie_biao` ADD COLUMN `zhuang_tai` varchar(255) DEFAULT NULL COMMENT ''状态'' AFTER `fu_ze_ren`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. 结束时间 jie_shu_shi_jian
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ren_wu_lie_biao'
    AND COLUMN_NAME = 'jie_shu_shi_jian'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `ren_wu_lie_biao` ADD COLUMN `jie_shu_shi_jian` varchar(255) DEFAULT NULL COMMENT ''结束时间'' AFTER `kai_shi_shi_jian`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
