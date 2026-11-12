-- ============================================================
-- V34: 「抄送我的」从已办任务页签拆为独立二级菜单
-- 幂等：全部使用 WHERE NOT EXISTS / 带旧值守卫的条件 UPDATE
-- 注意：nav_menu.key 没有唯一索引，禁止使用 ON DUPLICATE KEY UPDATE
-- ============================================================

SET @approval_center_id = (SELECT id FROM nav_menu WHERE `key` = 'approval-center' AND deleted = 0 LIMIT 1);

-- ---------- 1. 顺移后续菜单排序（仅当仍为 V32 初始值时才移动，不覆盖用户手动调整） ----------
UPDATE nav_menu SET sort = 7
WHERE `key` = 'approval-admin-stats' AND deleted = 0 AND parent_id = @approval_center_id AND sort = 6;

UPDATE nav_menu SET sort = 6
WHERE `key` = 'approval-admin-process' AND deleted = 0 AND parent_id = @approval_center_id AND sort = 5;

UPDATE nav_menu SET sort = 5
WHERE `key` = 'approval-start' AND deleted = 0 AND parent_id = @approval_center_id AND sort = 4;

-- ---------- 2. 二级菜单：抄送我的（排在已办任务之后） ----------
INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-cc', '抄送我的', '/approval/cc', 'approval/cc', NULL, 1, 'C', 'mail', 4, 1, @approval_center_id, 1, '业务菜单'
FROM DUAL
WHERE @approval_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-cc' AND deleted = 0);

-- ---------- 3. 按钮权限码 ----------
SET @approval_cc_id = (SELECT id FROM nav_menu WHERE `key` = 'approval-cc' AND deleted = 0 LIMIT 1);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-cc-view', '查看抄送', NULL, NULL, 'approval:cc:view', 0, 'F', NULL, 1, 1, @approval_cc_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_cc_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-cc-view' AND deleted = 0);

-- ---------- 4. 绑定到默认域（xingjiZM，domain_id = 1） ----------
INSERT INTO sys_domain_menu (domain_id, menu_id, sort)
SELECT 1, m.id, m.sort
FROM nav_menu m
WHERE m.`key` LIKE 'approval-cc%'
  AND m.deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu dm WHERE dm.domain_id = 1 AND dm.menu_id = m.id
  );

-- ---------- 5. 授权给 ROLE_ADMIN（role_id = 1） ----------
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, m.id
FROM nav_menu m
WHERE m.`key` LIKE 'approval-cc%'
  AND m.deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu rm WHERE rm.role_id = 1 AND rm.menu_id = m.id
  );
