-- ============================================================
-- 域管理修复脚本：清理已删除域的脏数据（含关联表），让用户能重新创建同名域
--
-- 问题：
--   - 用户删除「产品设计」「页面生成」后，sys_domain 里记录 deleted=1
--   - 但 domain_key 有唯一索引，已删除记录占着坑位
--   - 重新创建同名域时报唯一约束冲突 500
--
-- 执行方式（由运维操作）：
--   docker exec -i <mysql容器名> mysql -uroot -proot123456 material_system_react < ops-fix-domain-unique.sql
-- ============================================================

-- 1. 先把已删除域的 id 收集起来，清理关联表数据
DELETE FROM `sys_domain_menu` WHERE `domain_id` IN (
    SELECT id FROM (SELECT id FROM `sys_domain` WHERE `deleted` = 1) AS t
);
DELETE FROM `sys_user_domain` WHERE `domain_id` IN (
    SELECT id FROM (SELECT id FROM `sys_domain` WHERE `deleted` = 1) AS t
);

-- 2. 物理删除已逻辑删除的域记录（释放 domain_key 唯一索引坑位）
DELETE FROM `sys_domain` WHERE `deleted` = 1;

-- 3. 验证
SELECT '=== 修复后剩余的域 ===' AS info;
SELECT id, domain_name, domain_key, is_default, status, deleted
FROM `sys_domain` ORDER BY id;

SELECT '=== 修复完成 ===' AS info;
SELECT '已删除域的脏数据已彻底清理，现在可以重新创建同名域' AS msg;
