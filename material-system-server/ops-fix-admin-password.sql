-- ============================================================
-- 登录密码修复脚本：把线上 admin 密码同步成本地一致
--
-- 问题：线上 admin 密码是 admin123（历史数据），本地是 123123
-- 后端 AuthServiceImpl 用明文比对（password.equals），不是 BCrypt
--
-- 执行方式（由运维操作）：
--   docker exec -i <mysql容器名> mysql -uroot -proot123456 material_system_react < ops-fix-admin-password.sql
-- ============================================================

-- 更新 admin 密码为 123123（与本地一致，后端明文比对）
UPDATE `sys_user`
SET `password` = '123123',
    `update_time` = CURRENT_TIMESTAMP
WHERE `username` = 'admin';

-- 验证
SELECT '=== 修复后 admin 账号状态 ===' AS info;
SELECT id, username, password, status, deleted, update_time
FROM `sys_user` WHERE `username` = 'admin';
