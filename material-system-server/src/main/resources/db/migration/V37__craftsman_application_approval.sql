-- ============================================================
-- V37: 工匠申请接入审批中心
-- 1. craftsman_application 增加 approval_instance_id（审批实例 ID，
--    用于撤回时联动审批中心、审批回调幂等对账）
-- 幂等：SET @col_exists 判断列是否存在，可安全重跑
-- ============================================================

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'craftsman_application'
      AND COLUMN_NAME = 'approval_instance_id');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `craftsman_application` ADD COLUMN `approval_instance_id` VARCHAR(64) DEFAULT NULL COMMENT ''审批实例 ID（ appr_business_link.process_instance_id）'' AFTER `reject_reason`',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
