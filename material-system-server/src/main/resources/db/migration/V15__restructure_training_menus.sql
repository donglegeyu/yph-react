-- ============================================================
-- V12__restructure_training_menus.sql
-- 1. 培训资源 → 培训管理（重命名）
-- 2. 删除试卷管理菜单（exam-paper-manage）
-- 3. 培训任务管理移到培训管理下（从培训运营移出），并重命名为"培训任务"
-- 4. 删除培训运营菜单（training-operation）
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
