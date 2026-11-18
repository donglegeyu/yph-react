-- ============================================================
-- V7: 提交失败日志表（待办任务页「提交失败」统计卡数据源）
-- 背景：startInternal 失败时随主事务回滚，失败无痕；需要独立落库供统计与排查。
-- 口径：卡片统计全部 status='failed' 的记录（不限提交日期，处理完标记 resolved 后不再计入）。
-- 幂等：CREATE TABLE IF NOT EXISTS。
-- ============================================================
CREATE TABLE IF NOT EXISTS appr_submit_fail_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  business_type VARCHAR(64) NOT NULL COMMENT '业务场景类型（对应 appr_business_binding.business_type）',
  business_id BIGINT NULL COMMENT '业务单据 ID',
  business_no VARCHAR(64) NULL COMMENT '业务单据编号（可为空，提交阶段未必生成）',
  title VARCHAR(255) NULL COMMENT '申请标题',
  applicant_id BIGINT NULL COMMENT '申请人 ID',
  applicant_name VARCHAR(64) NULL COMMENT '申请人姓名',
  fail_reason VARCHAR(1000) NULL COMMENT '失败原因（BizException 文案或异常摘要）',
  status VARCHAR(20) NOT NULL DEFAULT 'failed' COMMENT '状态：failed=未处理（计入统计），resolved=已处理（预留）',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '失败时间',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_appr_submit_fail_log_status (status),
  KEY idx_appr_submit_fail_log_type_time (business_type, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批提交失败日志（业务服务发起审批失败时独立事务落库）';
