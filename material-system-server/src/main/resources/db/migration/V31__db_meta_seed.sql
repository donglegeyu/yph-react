-- ============================================================
-- V31__db_meta_seed.sql
-- 后端数据管理初始配置（全部幂等）：
--   1. 平台内部表标记为默认隐藏，并补齐 flyway_schema_history 缺失的中文名
--   2. 人工补充命名约定推断不出的字符串关联关系
-- 说明：后续如需增删，继续新建更高版本脚本，不修改本文件。
-- ============================================================

-- 1. 平台内部表：默认隐藏，便于默认视图聚焦业务表
INSERT INTO `db_meta_table_meta` (`table_name`, `display_name`, `group_name`, `sort_order`, `hidden`, `remark`)
SELECT 'flyway_schema_history', '数据库迁移记录', '平台内部', 90, 1, 'Flyway 版本历史，内部表'
WHERE NOT EXISTS (SELECT 1 FROM `db_meta_table_meta` WHERE `table_name` = 'flyway_schema_history');

INSERT INTO `db_meta_table_meta` (`table_name`, `display_name`, `group_name`, `sort_order`, `hidden`, `remark`)
SELECT 'page_migration_script', '页面迁移脚本', '平台内部', 91, 1, '页面生成器建表脚本记录，内部表'
WHERE NOT EXISTS (SELECT 1 FROM `db_meta_table_meta` WHERE `table_name` = 'page_migration_script');

INSERT INTO `db_meta_table_meta` (`table_name`, `display_name`, `group_name`, `sort_order`, `hidden`, `remark`)
SELECT 'page_definition', '页面配置定义', '平台内部', 92, 1, '页面生成器配置，内部表'
WHERE NOT EXISTS (SELECT 1 FROM `db_meta_table_meta` WHERE `table_name` = 'page_definition');

INSERT INTO `db_meta_table_meta` (`table_name`, `display_name`, `group_name`, `sort_order`, `hidden`, `remark`)
SELECT 'db_meta_table_meta', '表元信息配置', '平台内部', 93, 1, '后端数据管理自身配置表'
WHERE NOT EXISTS (SELECT 1 FROM `db_meta_table_meta` WHERE `table_name` = 'db_meta_table_meta');

INSERT INTO `db_meta_table_meta` (`table_name`, `display_name`, `group_name`, `sort_order`, `hidden`, `remark`)
SELECT 'db_meta_relation', '人工关系配置', '平台内部', 94, 1, '后端数据管理自身配置表'
WHERE NOT EXISTS (SELECT 1 FROM `db_meta_table_meta` WHERE `table_name` = 'db_meta_relation');

-- 2. 人工关系：字符串字段之间的关联，命名约定无法推断

-- 2.1 证书图片 -> 证书类型（按类型名关联）
INSERT INTO `db_meta_relation`
  (`from_table`, `from_column`, `to_table`, `to_column`, `relation_type`, `relation_label`, `enabled`, `remark`)
SELECT 'certificate_image', 'certificate_type', 'certificate_type', 'name',
       'many_to_one', '证书类型名称（字符串关联）', 1, '按证书类型名称匹配，非主键关联'
WHERE NOT EXISTS (
  SELECT 1 FROM `db_meta_relation`
  WHERE `from_table` = 'certificate_image' AND `from_column` = 'certificate_type'
    AND `to_table` = 'certificate_type' AND `to_column` = 'name'
);

-- 2.2 收藏 -> 菜单（按菜单 key 关联）
INSERT INTO `db_meta_relation`
  (`from_table`, `from_column`, `to_table`, `to_column`, `relation_type`, `relation_label`, `enabled`, `remark`)
SELECT 'favorite', 'menu_key', 'nav_menu', 'key',
       'many_to_one', '收藏菜单 key（字符串关联）', 1, '按菜单 key 匹配，非主键关联'
WHERE NOT EXISTS (
  SELECT 1 FROM `db_meta_relation`
  WHERE `from_table` = 'favorite' AND `from_column` = 'menu_key'
    AND `to_table` = 'nav_menu' AND `to_column` = 'key'
);

-- 2.3 页面配置创建人 -> 系统用户（按登录账号关联，弱关联）
INSERT INTO `db_meta_relation`
  (`from_table`, `from_column`, `to_table`, `to_column`, `relation_type`, `relation_label`, `enabled`, `remark`)
SELECT 'page_definition', 'created_by', 'sys_user', 'username',
       'many_to_one', '创建人账号（弱关联）', 1, '存登录账号，可能包含 system 等非用户值'
WHERE NOT EXISTS (
  SELECT 1 FROM `db_meta_relation`
  WHERE `from_table` = 'page_definition' AND `from_column` = 'created_by'
    AND `to_table` = 'sys_user' AND `to_column` = 'username'
);
