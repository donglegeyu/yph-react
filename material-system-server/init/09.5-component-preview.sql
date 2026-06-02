-- 在系统中心下添加系统设置菜单，并在系统设置下添加组件预览菜单
-- 说明: 使用动态查询获取父级ID，避免硬编码

-- 插入系统设置菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT 'system-settings', '系统设置', NULL, 'tool', 4, 1,
       (SELECT id FROM (SELECT id FROM nav_menu WHERE `key` = 'settings-center') AS t),
       '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'system-settings');

-- 在系统设置下添加组件预览菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT 'component-preview', '组件预览', '/component-preview', 'app', 1, 1,
       (SELECT id FROM (SELECT id FROM nav_menu WHERE `key` = 'system-settings') AS t),
       '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'component-preview');
