-- ============================================================
-- V16__backfill_craftsman_application.sql
-- 1. 回填：把工匠主表已有的历史数据，补录为「审批通过」的申请单
-- 2. 补全：id 1-5 的早期种子数据缺失常住地址，补默认值（北京市朝阳区）
-- 背景：工匠申请功能是后加的，历史工匠直接进了主表且部分地址未填。
-- 幂等：申请单靠 application_no 唯一索引去重；地址靠字段非空判断
-- ============================================================

-- 1. 补全缺失的常住地址（仅更新空字段，不覆盖已有值）
UPDATE `craftsman`
SET `residential_area_code` = '11,1101,110105',
    `residential_street` = CASE WHEN IFNULL(`residential_street`,'')='' THEN '建国门外街道' ELSE `residential_street` END,
    `residential_detail` = CASE WHEN IFNULL(`residential_detail`,'')='' THEN '建国路88号' ELSE `residential_detail` END,
    `residential_address` = CASE WHEN IFNULL(`residential_address`,'')='' THEN '北京市北京市朝阳区建国门外街道建国路88号' ELSE `residential_address` END
WHERE `deleted` = 0
  AND IFNULL(`residential_area_code`,'') = '';

-- 2. 回填：历史工匠 → 审批通过的申请单
INSERT INTO `craftsman_application` (
  `application_no`, `application_type`, `status`,
  `name`, `phone`, `user_account`, `service_provider_name`,
  `applicant`, `apply_time`, `form_data`, `create_time`, `update_time`
)
SELECT
  CONCAT('WA_HIS_', LPAD(c.id, 6, '0')),
  'add',
  'approved',
  c.name,
  c.phone,
  c.user_account,
  c.service_provider_name,
  'system',
  DATE(c.create_time),
  NULL,
  c.create_time,
  c.update_time
FROM `craftsman` c
WHERE c.deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM `craftsman_application` a
    WHERE a.application_no = CONCAT('WA_HIS_', LPAD(c.id, 6, '0'))
  );
