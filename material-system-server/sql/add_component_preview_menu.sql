-- 在系统中心下添加系统设置菜单，并在系统设置下添加组件预览菜单
-- 执行时间: 2026-04-24
-- 说明: 为系统中心添加系统设置子菜单，并在系统设置下添加组件预览功能

-- 插入系统设置菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT 'system-settings', '系统设置', NULL, 'tool', 4, 1,
       (SELECT id FROM nav_menu WHERE `key` = 'settings-center' AND deleted = 0), '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'system-settings');

-- 在系统设置下添加组件预览菜单
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type)
SELECT 'component-preview', '组件预览', '/component-preview', 'app', 1, 1,
       (SELECT id FROM nav_menu WHERE `key` = 'system-settings' AND deleted = 0), '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'component-preview');

-- 验证结果
SELECT
  m.id,
  m.`key`,
  m.label,
  m.path,
  p.label as parent_label
FROM nav_menu m
LEFT JOIN nav_menu p ON m.parent_id = p.id
WHERE m.label IN ('系统设置', '组件预览');
