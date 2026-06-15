-- 权限管理目录菜单结构调整
USE material_system_react;

-- 1. 新建"权限管理"二级目录
INSERT INTO nav_menu (`key`, label, path, parent_id, sort, menu_type, menu_category, icon, status)
SELECT 'permission-center', '权限管理', NULL, 13, 1, '业务菜单', 'M', 'safe', 1
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='permission-center' AND deleted=0);

SET @permDirId = (SELECT id FROM nav_menu WHERE `key`='permission-center' AND deleted=0 LIMIT 1);

-- 2. 新增"部门管理"和"角色管理"菜单
INSERT INTO nav_menu (`key`, label, path, parent_id, sort, menu_type, menu_category, icon, status)
SELECT 'department-management', '部门管理', '/department-management', @permDirId, 2, '业务菜单', 'C', 'team', 1
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='department-management' AND deleted=0);

INSERT INTO nav_menu (`key`, label, path, parent_id, sort, menu_type, menu_category, icon, status)
SELECT 'role-management', '角色管理', '/role-management', @permDirId, 3, '业务菜单', 'C', 'award', 1
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='role-management' AND deleted=0);

-- 3. 把"账号管理"和"权限查询"挪到"权限管理"目录下
UPDATE nav_menu SET parent_id=@permDirId, sort=1 WHERE `key`='user-management' AND deleted=0;
UPDATE nav_menu SET parent_id=@permDirId, sort=4 WHERE `key`='permission-query' AND deleted=0;

-- 4. 同步域关联（域 1 能看到这 3 个新菜单）
SET @deptMenuId = (SELECT id FROM nav_menu WHERE `key`='department-management' AND deleted=0 LIMIT 1);
SET @roleMenuId = (SELECT id FROM nav_menu WHERE `key`='role-management' AND deleted=0 LIMIT 1);

INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort, create_time)
SELECT 1, @permDirId, '权限管理', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_domain_menu WHERE domain_id=1 AND menu_id=@permDirId);

INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort, create_time)
SELECT 1, @deptMenuId, '部门管理', 2, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_domain_menu WHERE domain_id=1 AND menu_id=@deptMenuId);

INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort, create_time)
SELECT 1, @roleMenuId, '角色管理', 3, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_domain_menu WHERE domain_id=1 AND menu_id=@roleMenuId);

-- 5. 同步 sys_role_menu：超级管理员(role_id=1) 拥有所有菜单
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM nav_menu
WHERE deleted=0 AND status=1
AND id NOT IN (SELECT menu_id FROM sys_role_menu WHERE role_id=1);

-- 6. 验证
SELECT '=== structure ===' AS info;
SELECT id, `key`, label, parent_id, sort, menu_category, icon FROM nav_menu
WHERE (parent_id=13 OR parent_id=@permDirId) AND deleted=0 ORDER BY parent_id, sort;
