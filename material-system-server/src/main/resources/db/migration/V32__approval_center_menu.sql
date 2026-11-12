-- ============================================================
-- V32: 新增「审批中心」一级菜单、6 个子菜单与按钮权限码
-- 幂等：全部使用 WHERE NOT EXISTS，可在已执行过的库上安全重跑
-- 注意：nav_menu.key 没有唯一索引，禁止使用 ON DUPLICATE KEY UPDATE
-- ============================================================

-- ---------- 1. 一级菜单 ----------
INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-center', '审批中心', NULL, NULL, NULL, 1, 'M', 'check-circle', 6, 1, 0, 0, '业务菜单'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-center' AND deleted = 0);

SET @approval_center_id = (SELECT id FROM nav_menu WHERE `key` = 'approval-center' AND deleted = 0 LIMIT 1);

-- ---------- 2. 二级菜单 ----------
INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-todo', '待办任务', '/approval/todo', 'approval/todo', NULL, 1, 'C', 'list', 1, 1, @approval_center_id, 1, '业务菜单'
FROM DUAL
WHERE @approval_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-todo' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-mine', '我发起的', '/approval/mine', 'approval/mine', NULL, 1, 'C', 'file-text', 2, 1, @approval_center_id, 1, '业务菜单'
FROM DUAL
WHERE @approval_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-mine' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-done', '已办任务', '/approval/done', 'approval/done', NULL, 1, 'C', 'check-square', 3, 1, @approval_center_id, 1, '业务菜单'
FROM DUAL
WHERE @approval_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-done' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-start', '发起审批', '/approval/start', 'approval/start', NULL, 1, 'C', 'edit', 4, 1, @approval_center_id, 1, '业务菜单'
FROM DUAL
WHERE @approval_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-start' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-admin-process', '流程定义', '/approval/admin/process', 'approval/admin/process', NULL, 1, 'C', 'setting', 5, 1, @approval_center_id, 1, '业务菜单'
FROM DUAL
WHERE @approval_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-admin-process' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-admin-stats', '审批统计', '/approval/admin/stats', 'approval/admin/stats', NULL, 1, 'C', 'clipboard', 6, 1, @approval_center_id, 1, '业务菜单'
FROM DUAL
WHERE @approval_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-admin-stats' AND deleted = 0);

-- ---------- 3. 按钮权限码（menu_category = 'F'，visible = 0） ----------
SET @approval_todo_id = (SELECT id FROM nav_menu WHERE `key` = 'approval-todo' AND deleted = 0 LIMIT 1);
SET @approval_mine_id = (SELECT id FROM nav_menu WHERE `key` = 'approval-mine' AND deleted = 0 LIMIT 1);
SET @approval_done_id = (SELECT id FROM nav_menu WHERE `key` = 'approval-done' AND deleted = 0 LIMIT 1);
SET @approval_start_id = (SELECT id FROM nav_menu WHERE `key` = 'approval-start' AND deleted = 0 LIMIT 1);
SET @approval_process_id = (SELECT id FROM nav_menu WHERE `key` = 'approval-admin-process' AND deleted = 0 LIMIT 1);
SET @approval_stats_id = (SELECT id FROM nav_menu WHERE `key` = 'approval-admin-stats' AND deleted = 0 LIMIT 1);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-todo-view', '查看待办', NULL, NULL, 'approval:todo:view', 0, 'F', NULL, 1, 1, @approval_todo_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_todo_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-todo-view' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-todo-approve', '通过', NULL, NULL, 'approval:todo:approve', 0, 'F', NULL, 2, 1, @approval_todo_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_todo_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-todo-approve' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-todo-reject', '驳回', NULL, NULL, 'approval:todo:reject', 0, 'F', NULL, 3, 1, @approval_todo_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_todo_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-todo-reject' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-mine-view', '查看我发起的', NULL, NULL, 'approval:mine:view', 0, 'F', NULL, 1, 1, @approval_mine_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_mine_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-mine-view' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-mine-cancel', '撤回', NULL, NULL, 'approval:mine:cancel', 0, 'F', NULL, 2, 1, @approval_mine_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_mine_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-mine-cancel' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-done-view', '查看已办', NULL, NULL, 'approval:done:view', 0, 'F', NULL, 1, 1, @approval_done_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_done_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-done-view' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-start-view', '查看可发起', NULL, NULL, 'approval:start:view', 0, 'F', NULL, 1, 1, @approval_start_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_start_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-start-view' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-start-submit', '提交审批', NULL, NULL, 'approval:start:submit', 0, 'F', NULL, 2, 1, @approval_start_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_start_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-start-submit' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-process-view', '查看流程定义', NULL, NULL, 'approval:process:view', 0, 'F', NULL, 1, 1, @approval_process_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_process_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-process-view' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-process-publish', '发布流程', NULL, NULL, 'approval:process:publish', 0, 'F', NULL, 2, 1, @approval_process_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_process_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-process-publish' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-process-disable', '停用流程', NULL, NULL, 'approval:process:disable', 0, 'F', NULL, 3, 1, @approval_process_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_process_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-process-disable' AND deleted = 0);

INSERT INTO nav_menu (`key`, label, path, component, perms, visible, menu_category, icon, sort, status, parent_id, level, menu_type)
SELECT 'approval-stats-view', '查看审批统计', NULL, NULL, 'approval:stats:view', 0, 'F', NULL, 1, 1, @approval_stats_id, 2, '业务菜单'
FROM DUAL
WHERE @approval_stats_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'approval-stats-view' AND deleted = 0);

-- ---------- 4. 绑定到默认域（xingjiZM，domain_id = 1） ----------
INSERT INTO sys_domain_menu (domain_id, menu_id, sort)
SELECT 1, m.id, m.sort
FROM nav_menu m
WHERE m.`key` LIKE 'approval-%'
  AND m.deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu dm WHERE dm.domain_id = 1 AND dm.menu_id = m.id
  );

-- ---------- 5. 授权给 ROLE_ADMIN（role_id = 1） ----------
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, m.id
FROM nav_menu m
WHERE m.`key` LIKE 'approval-%'
  AND m.deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu rm WHERE rm.role_id = 1 AND rm.menu_id = m.id
  );
