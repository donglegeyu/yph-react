-- V3: 审批操作补全（撤回 / 催办 / 转办 / 加签 / 抄送）
-- 1) 去掉 appr_task_action.task_id 的唯一键：转办、加签、催办会让同一任务/实例产生多条动作记录，
--    唯一键 + insert ignore 会静默丢掉后续记录
-- 2) 新增抄送表 appr_cc

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'appr_task_action' AND index_name = 'uk_task_id');
SET @ddl := IF(@idx_exists > 0, 'ALTER TABLE appr_task_action DROP INDEX uk_task_id', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'appr_task_action' AND index_name = 'idx_task');
SET @ddl := IF(@idx_exists = 0, 'ALTER TABLE appr_task_action ADD INDEX idx_task (task_id)', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS appr_cc (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  process_instance_id VARCHAR(64) NOT NULL COMMENT '流程实例ID',
  business_no VARCHAR(64) NULL COMMENT '业务单号',
  receiver_id BIGINT NOT NULL COMMENT '接收人ID',
  receiver_name VARCHAR(64) NULL COMMENT '接收人姓名',
  read_status TINYINT NOT NULL DEFAULT 0 COMMENT '0未读 1已读',
  read_time DATETIME NULL COMMENT '已读时间',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '抄送时间',
  UNIQUE KEY uk_instance_receiver (process_instance_id, receiver_id),
  KEY idx_receiver (receiver_id, read_status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '审批抄送表';
