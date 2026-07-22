-- ============================================================
-- V21: 清理非默认域 sys_domain_menu.custom_parent_id 脏数据
--
-- 背景：
--   旧代码在配置域菜单时，把 custom_parent_id 存成了错误的值
--   （前端临时 id 或 sys_domain_menu.id，而非 menuId），
--   导致域菜单树层级完全错乱。
--
-- 修复后的代码语义：
--   custom_parent_id 存的是 menuId（nav_menu.id），
--   null = 继承系统默认层级，0 = 根级。
--
-- 本脚本做法：
--   将所有非默认域（is_default=0）的 custom_parent_id 重置为 NULL，
--   让菜单恢复继承系统默认层级。
--   用户可通过域管理页面重新配置自定义层级。
--
-- 幂等性：
--   UPDATE 本身可重复执行，重复执行时不会再匹配到已为 NULL 的行。
-- ============================================================

-- 清理非默认域的脏数据：custom_parent_id 置为 NULL
UPDATE sys_domain_menu sdm
INNER JOIN sys_domain sd ON sdm.domain_id = sd.id
SET sdm.custom_parent_id = NULL
WHERE sd.is_default = 0
  AND sdm.custom_parent_id IS NOT NULL;

-- 修正字段注释，明确语义为 menuId（nav_menu.id）
ALTER TABLE sys_domain_menu
  MODIFY COLUMN `custom_parent_id` bigint DEFAULT NULL
  COMMENT '域内自定义父菜单的menuId（nav_menu.id）；NULL=继承系统默认层级，0=根级';

SELECT CONCAT('V21 done: cleaned custom_parent_id for non-default domains') AS msg;
