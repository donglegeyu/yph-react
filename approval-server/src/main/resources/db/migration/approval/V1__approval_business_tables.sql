-- 验证用最小业务表：只用于确认 Flyway 7.15.0 在 Boot 3.5.16 下可执行
CREATE TABLE IF NOT EXISTS appr_business_link (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_instance_id VARCHAR(64)  NOT NULL,
  process_def_key     VARCHAR(128) NOT NULL,
  business_type       VARCHAR(64)  NOT NULL,
  business_id         BIGINT       NOT NULL,
  business_no         VARCHAR(64),
  title               VARCHAR(255) NOT NULL,
  applicant_id        BIGINT       NOT NULL,
  applicant_dept_id   BIGINT,
  status              VARCHAR(32)  NOT NULL,
  form_key            VARCHAR(64),
  form_version        INT,
  form_data           JSON,
  create_time         DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_process_instance (process_instance_id),
  KEY idx_applicant (applicant_id, status),
  KEY idx_business (business_type, business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
