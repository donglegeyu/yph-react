-- 初始化系统数据

-- 创建默认 admin 用户
INSERT INTO sys_user (username, password, nickname, status)
SELECT 'admin', 'admin123', '管理员', 1
WHERE NOT EXISTS (SELECT 1 FROM sys_user WHERE username = 'admin');

-- admin 用户关联默认域
INSERT INTO sys_user_domain (user_id, domain_id)
SELECT u.id, d.id
FROM sys_user u, sys_domain d
WHERE u.username = 'admin'
  AND d.domain_key = 'xingjiZM'
  AND NOT EXISTS (
    SELECT 1 FROM sys_user_domain sud
    WHERE sud.user_id = u.id AND sud.domain_id = d.id
  );

-- admin 用户关联工匠平台域（管理员可访问所有域）
INSERT INTO sys_user_domain (user_id, domain_id)
SELECT u.id, d.id
FROM sys_user u, sys_domain d
WHERE u.username = 'admin'
  AND d.domain_key = 'gongjiangPT'
  AND NOT EXISTS (
    SELECT 1 FROM sys_user_domain sud
    WHERE sud.user_id = u.id AND sud.domain_id = d.id
  );

-- ============================================================
-- 工匠演示账号（用于功能演示，生产环境可删除）
-- ============================================================
INSERT INTO sys_user (username, password, nickname, real_name, dept_id, phone, status)
SELECT 'craftsman', '123123', '工匠演示', '张工匠', 2, '13800000002', 1
WHERE NOT EXISTS (SELECT 1 FROM sys_user WHERE username = 'craftsman');

-- 工匠演示账号关联两个域
INSERT INTO sys_user_domain (user_id, domain_id)
SELECT u.id, d.id
FROM sys_user u, sys_domain d
WHERE u.username = 'craftsman'
  AND d.domain_key IN ('xingjiZM', 'gongjiangPT')
  AND NOT EXISTS (
    SELECT 1 FROM sys_user_domain sud
    WHERE sud.user_id = u.id AND sud.domain_id = d.id
  );

-- 修复所有菜单的 level 值（确保其他初始化脚本中插入的菜单也有正确层级）
UPDATE nav_menu SET level = 0 WHERE parent_id IS NULL OR parent_id = 0;
UPDATE nav_menu SET level = 1 WHERE parent_id IN (SELECT id FROM (SELECT id FROM nav_menu WHERE parent_id IS NULL OR parent_id = 0) AS t) AND (parent_id IS NOT NULL AND parent_id != 0);
UPDATE nav_menu SET level = 2 WHERE parent_id IN (SELECT id FROM (SELECT id FROM nav_menu WHERE level = 1) AS t);
UPDATE nav_menu SET level = 3 WHERE parent_id IN (SELECT id FROM (SELECT id FROM nav_menu WHERE level = 2) AS t);
