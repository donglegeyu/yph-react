-- 审批侧需要展示申请人姓名，避免跨服务 JOIN 主库 sys_user
ALTER TABLE appr_business_link ADD COLUMN applicant_name VARCHAR(64) AFTER applicant_id;

-- P0 审批动作流水：记录同意/驳回及意见，用于"已办任务"展示我的处理结果
CREATE TABLE IF NOT EXISTS appr_task_action (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_instance_id VARCHAR(64)  NOT NULL,
  task_id             VARCHAR(64)  NOT NULL,
  task_def_key        VARCHAR(128),
  action              VARCHAR(32)  NOT NULL,
  operator_id         BIGINT       NOT NULL,
  operator_name       VARCHAR(64),
  comment             VARCHAR(500),
  create_time         DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_task_id (task_id),
  KEY idx_process_instance (process_instance_id),
  KEY idx_operator (operator_id, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
