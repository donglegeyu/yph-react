-- ============================================================
-- V18__sync_training_role_permissions.sql
-- 1. 培训资源 → 培训管理（重命名）
-- 2. 删除试卷管理菜单（exam-paper-manage）
-- 3. 培训任务管理移到培训管理下（从培训运营移出），并重命名为"培训任务"
-- 4. 删除培训运营菜单（training-operation）
-- 5. 同步非超管角色的菜单权限
-- ============================================================

-- 1. 重命名 培训资源 → 培训管理
UPDATE nav_menu SET label = '培训管理' WHERE `key` = 'training-resource' AND deleted = 0;
UPDATE sys_domain_menu SET custom_label = '培训管理' WHERE menu_id IN (SELECT id FROM nav_menu WHERE `key` = 'training-resource' AND deleted = 0);

-- 2. 删除试卷管理菜单（逻辑删除 + 清理关联）
UPDATE nav_menu SET deleted = 1 WHERE `key` = 'exam-paper-manage' AND deleted = 0;
DELETE FROM sys_domain_menu WHERE menu_id IN (SELECT id FROM nav_menu WHERE `key` = 'exam-paper-manage');
DELETE FROM sys_role_menu WHERE menu_id IN (SELECT id FROM nav_menu WHERE `key` = 'exam-paper-manage');

-- 3. 培训任务 移到培训管理下，并重命名
UPDATE nav_menu SET parent_id = (SELECT id FROM (SELECT id FROM nav_menu WHERE `key` = 'training-resource' AND deleted = 0 LIMIT 1) t),
                     label = '培训任务'
WHERE `key` = 'training-task-manage' AND deleted = 0;
UPDATE sys_domain_menu SET custom_label = '培训任务' WHERE menu_id IN (SELECT id FROM nav_menu WHERE `key` = 'training-task-manage' AND deleted = 0);

-- 4. 删除培训运营菜单（逻辑删除 + 清理关联）
UPDATE nav_menu SET deleted = 1 WHERE `key` = 'training-operation' AND deleted = 0;
DELETE FROM sys_domain_menu WHERE menu_id IN (SELECT id FROM nav_menu WHERE `key` = 'training-operation');
DELETE FROM sys_role_menu WHERE menu_id IN (SELECT id FROM nav_menu WHERE `key` = 'training-operation');

-- 5. 同步非超管角色的菜单权限（幂等）
-- 将培训管理及其子菜单分配给所有拥有工匠中心(id=22)权限的非超管角色
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT DISTINCT rm.role_id, m.id
FROM sys_role_menu rm
JOIN nav_menu m ON m.`key` IN (
    'training-resource', 'courseware-manage', 'course-manage',
    'question-bank-manage', 'training-task-manage'
)
WHERE rm.menu_id = 22
  AND rm.role_id NOT IN (SELECT id FROM sys_role WHERE role_code = 'ROLE_ADMIN')
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu srm
    WHERE srm.role_id = rm.role_id AND srm.menu_id = m.id
  );
