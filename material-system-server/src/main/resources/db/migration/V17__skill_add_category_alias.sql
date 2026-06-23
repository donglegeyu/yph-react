-- ============================================================
-- V17__skill_add_category_alias.sql
-- 技能表新增「三级品类别名」字段
-- 默认根据三级品类（category3）反显，用户可编辑
-- ============================================================

ALTER TABLE `skill`
  ADD COLUMN `category_alias` VARCHAR(100) DEFAULT NULL
    COMMENT '三级品类别名'
    AFTER `category3`;

UPDATE `skill`
  SET `category_alias` = `category3`
  WHERE (`category_alias` IS NULL OR `category_alias` = '') AND `category3` IS NOT NULL AND `category3` <> '';
