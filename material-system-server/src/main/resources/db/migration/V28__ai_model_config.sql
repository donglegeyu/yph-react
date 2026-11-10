-- ============================================================
-- V28__ai_model_config.sql
-- AI 智能助手对接真实网关：
--   1. ai_model_config 模型配置表（OpenAI 兼容网关连接参数，运行时由「模型管理」页面维护）
--   2. 「系统设置」下新增三级菜单：模型管理（/ai-model-config）
-- 所有 INSERT 均为幂等，可重复执行不出错
-- ============================================================

-- 1. 模型配置表
CREATE TABLE IF NOT EXISTS ai_model_config (
    id            bigint       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    config_name   varchar(100) NOT NULL COMMENT '配置名称',
    base_url      varchar(255) NOT NULL COMMENT '网关地址（OpenAI 兼容，如 https://api.deepseek.com）',
    api_key       varchar(255) NOT NULL COMMENT 'API Key（接口返回时脱敏）',
    model_name    varchar(100) NOT NULL COMMENT '模型名（如 deepseek-chat）',
    system_prompt text         NULL COMMENT '系统提示词（缺省用内置默认）',
    temperature   decimal(3,2) DEFAULT 0.70 COMMENT '采样温度',
    max_tokens    int          NULL COMMENT '最大输出 tokens（空则不限制）',
    is_default    tinyint      DEFAULT 0 COMMENT '是否默认配置 1/0（AI 对话使用默认配置）',
    status        tinyint      DEFAULT 1 COMMENT '状态 1 启用 0 禁用',
    remark        varchar(255) NULL COMMENT '备注',
    create_time   datetime     DEFAULT CURRENT_TIMESTAMP,
    update_time   datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted       tinyint      DEFAULT 0 COMMENT '逻辑删除 0/1',
    KEY idx_ai_model_config_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 模型网关配置';

-- 2. 新增三级菜单（幂等）：模型管理，挂载到「系统设置」下
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'ai-model-config', '模型管理', '/ai-model-config', 'link', 7, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='system-settings' AND deleted=0 LIMIT 1) t), 2, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='ai-model-config' AND deleted=0);

-- 3. 同步到默认域（幂等：已存在则跳过）
INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort)
SELECT d.id, m.id, m.label, m.sort
FROM nav_menu m
CROSS JOIN sys_domain d
WHERE d.is_default = 1 AND d.status = 1
  AND m.`key` = 'ai-model-config'
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu sdm
    WHERE sdm.domain_id = d.id AND sdm.menu_id = m.id
  );

-- 4. 同步超管角色权限（幂等）
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r
JOIN nav_menu m ON m.`key` = 'ai-model-config'
WHERE r.role_code = 'ROLE_ADMIN'
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu srm
    WHERE srm.role_id = r.id AND srm.menu_id = m.id
  );
