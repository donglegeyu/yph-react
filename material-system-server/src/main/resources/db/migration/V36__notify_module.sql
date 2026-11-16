-- ============================================================
-- V36: 站内信模块（Notify）
-- 1. 建表 notify_message_template（消息模板）
-- 2. 建表 notify_message（站内信，含已读状态）
-- 3. 种子模板 system_announcement
-- 4. 「收件箱」「消息模板」两个子菜单挂到已有「消息中心」一级菜单（key=message-center）下
-- 幂等：全部使用 WHERE NOT EXISTS / IF NOT EXISTS，可安全重跑
-- 注意：nav_menu.key 没有唯一索引，禁止使用 ON DUPLICATE KEY UPDATE
-- ============================================================

-- ---------- 1. 消息模板表 ----------
CREATE TABLE IF NOT EXISTS notify_message_template (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    code        VARCHAR(64)  NOT NULL COMMENT '模板编码（业务唯一，应用层保证）',
    name        VARCHAR(100) NOT NULL COMMENT '模板名称',
    type        TINYINT      NOT NULL DEFAULT 1 COMMENT '类型：1系统通知 2审批通知（预留）',
    content     TEXT         NULL COMMENT '模板内容，支持 {paramName} 占位符',
    status      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：0停用 1启用',
    remark      VARCHAR(255) NULL COMMENT '备注',
    create_by   VARCHAR(64)  NULL COMMENT '创建人',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted     TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除：0正常 1删除',
    PRIMARY KEY (id),
    KEY idx_code (code),
    KEY idx_type (type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '站内信消息模板';

-- ---------- 2. 站内信表 ----------
CREATE TABLE IF NOT EXISTS notify_message (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id       BIGINT       NOT NULL COMMENT '收件人 sys_user.id',
    domain_id     BIGINT       NULL COMMENT '发送来源域（仅记录）',
    template_id   BIGINT       NULL COMMENT '来源模板 id',
    template_code VARCHAR(64)  NULL COMMENT '来源模板编码',
    title         VARCHAR(200) NOT NULL COMMENT '标题（渲染后快照）',
    content       TEXT         NULL COMMENT '内容（渲染后快照，模板改动不影响历史消息）',
    type          TINYINT      NOT NULL DEFAULT 1 COMMENT '类型：1系统通知 2审批通知（预留）',
    read_status   TINYINT      NOT NULL DEFAULT 0 COMMENT '已读状态：0未读 1已读',
    read_time     DATETIME     NULL COMMENT '已读时间',
    create_time   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted       TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除：0正常 1删除',
    PRIMARY KEY (id),
    KEY idx_user_read (user_id, read_status, deleted),
    KEY idx_template_id (template_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '站内信';

-- ---------- 3. 种子模板 ----------
INSERT INTO notify_message_template (code, name, type, content, status, remark, create_by)
SELECT 'system_announcement', '系统公告', 1,
       '{content}', 1, '系统公告通用模板，发送时通过 content 参数传入正文', 'system'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM notify_message_template WHERE code = 'system_announcement' AND deleted = 0);

-- ---------- 4. 子菜单（挂到已有「消息中心」一级菜单 key=message-center 下） ----------
SET @message_center_id = (SELECT id FROM nav_menu WHERE `key` = 'message-center' AND deleted = 0 LIMIT 1);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'notify-inbox', '收件箱', '/message-center', NULL, NULL, 1, 'C', 'bell', 1, 1, @message_center_id, 1, '业务菜单'
FROM DUAL
WHERE @message_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'notify-inbox' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'notify-template', '消息模板', '/notify-template', NULL, NULL, 1, 'C', 'file-text', 2, 1, @message_center_id, 1, '业务菜单'
FROM DUAL
WHERE @message_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'notify-template' AND deleted = 0);

-- ---------- 5. 绑定到默认域（domain_id = 1） ----------
INSERT INTO sys_domain_menu (domain_id, menu_id, sort)
SELECT 1, m.id, m.sort
FROM nav_menu m
WHERE m.`key` LIKE 'notify-%'
  AND m.deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu dm WHERE dm.domain_id = 1 AND dm.menu_id = m.id
  );

-- ---------- 6. 授权给 ROLE_ADMIN（role_id = 1） ----------
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, m.id
FROM nav_menu m
WHERE m.`key` LIKE 'notify-%'
  AND m.deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu rm WHERE rm.role_id = 1 AND rm.menu_id = m.id
  );
