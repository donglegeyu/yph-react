-- ============================================================
-- V19__add_page_generator_menu.sql
-- 系统设置下新增三级菜单：页面生成器（/page-generator）
-- 用于通过可视化向导配置生成业务列表页
-- 所有 INSERT 均为幂等：按 key 判重，已存在则跳过
-- ============================================================

-- 1. 新增三级菜单（幂等）：页面生成器，挂载到「系统设置」下
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'page-generator', '页面生成器', '/page-generator', 'app', 6, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='system-settings' AND deleted=0 LIMIT 1) t), 2, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='page-generator' AND deleted=0);

-- 2. 同步到默认域（幂等：已存在则跳过）
INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort)
SELECT d.id, m.id, m.label, m.sort
FROM nav_menu m
CROSS JOIN sys_domain d
WHERE d.is_default = 1 AND d.status = 1
  AND m.`key` = 'page-generator'
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu sdm
    WHERE sdm.domain_id = d.id AND sdm.menu_id = m.id
  );

-- 3. 同步超管角色权限（幂等）
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r
JOIN nav_menu m ON m.`key` = 'page-generator'
WHERE r.role_code = 'ROLE_ADMIN'
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu srm
    WHERE srm.role_id = r.id AND srm.menu_id = m.id
  );
