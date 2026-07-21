-- ============================================================
-- V14__delete_component_preview_menu.sql
-- 删除组件预览菜单（id=21），仅通过主题设置按钮访问
-- ============================================================

-- 1. 逻辑删除菜单
UPDATE nav_menu SET deleted = 1 WHERE `key` = 'component-preview' AND deleted = 0;

-- 2. 清理域菜单关联
DELETE FROM sys_domain_menu WHERE menu_id IN (SELECT id FROM nav_menu WHERE `key` = 'component-preview');

-- 3. 清理角色权限关联
DELETE FROM sys_role_menu WHERE menu_id IN (SELECT id FROM nav_menu WHERE `key` = 'component-preview');
