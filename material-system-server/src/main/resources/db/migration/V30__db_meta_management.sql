-- ============================================================
-- V30__db_meta_management.sql
-- 「系统设置 > 后端数据管理」（/db-meta）：
--   1. 表元信息配置表 db_meta_table_meta：中文名 / 分组 / 默认隐藏，为空则走默认推断
--   2. 人工关系配置表 db_meta_relation：补充命名约定推断不出的关系，
--      或通过 enabled=0 抑制错误推断（同一组 from/to 字段以本表为准）
--   3. 新增三级菜单：后端数据管理（仅授予超管 ROLE_ADMIN）
-- 所有语句幂等，可重复执行不出错。
-- 说明：两张配置表不使用逻辑删除，改用 enabled / hidden 开关，
--       因此唯一索引无需 del_key（避免 V29 中逻辑删除撞唯一键的问题）。
-- ============================================================

-- 1. 表元信息配置（按需覆盖，未配置的表走表注释与默认分组）
CREATE TABLE IF NOT EXISTS `db_meta_table_meta` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `table_name`   VARCHAR(64)  NOT NULL COMMENT '物理表名',
  `display_name` VARCHAR(128) DEFAULT NULL COMMENT '中文显示名（为空时取表注释）',
  `group_name`   VARCHAR(64)  DEFAULT NULL COMMENT '分组名（为空时按表名前缀自动分组）',
  `sort_order`   INT          NOT NULL DEFAULT 0 COMMENT '组内排序，越小越靠前',
  `hidden`       TINYINT      NOT NULL DEFAULT 0 COMMENT '是否默认隐藏 1隐藏 0显示（内部表用）',
  `remark`       VARCHAR(255) DEFAULT NULL COMMENT '备注',
  `create_time`  DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time`  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_db_meta_table` (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后端数据管理-表元信息配置';

-- 2. 人工关系配置（source=manual，优先级高于外键与命名约定）
CREATE TABLE IF NOT EXISTS `db_meta_relation` (
  `id`             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `from_table`     VARCHAR(64)  NOT NULL COMMENT '源表名',
  `from_column`    VARCHAR(64)  NOT NULL COMMENT '源字段名',
  `to_table`       VARCHAR(64)  NOT NULL COMMENT '目标表名',
  `to_column`      VARCHAR(64)  NOT NULL DEFAULT 'id' COMMENT '目标字段名，默认主键 id',
  `relation_type`  VARCHAR(32)  NOT NULL DEFAULT 'many_to_one' COMMENT '关系类型 many_to_one/one_to_one/self_reference',
  `relation_label` VARCHAR(128) DEFAULT NULL COMMENT '关系说明（如：品牌标识 -> 标签编码）',
  `enabled`        TINYINT      NOT NULL DEFAULT 1 COMMENT '1启用（补充/覆盖）0停用（抑制同名推断关系）',
  `remark`         VARCHAR(255) DEFAULT NULL COMMENT '备注',
  `create_time`    DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time`    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_db_meta_relation` (`from_table`, `from_column`, `to_table`, `to_column`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后端数据管理-人工关系配置';

-- 3. 新增三级菜单（幂等）：后端数据管理，挂载到「系统设置」下
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, level, menu_type)
SELECT 'db-meta', '后端数据管理', '/db-meta', 'link', 8, 1,
    (SELECT id FROM (SELECT id FROM nav_menu WHERE `key`='system-settings' AND deleted=0 LIMIT 1) t), 2, '业务菜单'
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key`='db-meta' AND deleted=0);

-- 4. 同步到默认域（幂等：已存在则跳过）
INSERT INTO sys_domain_menu (domain_id, menu_id, custom_label, sort)
SELECT d.id, m.id, m.label, m.sort
FROM nav_menu m
CROSS JOIN sys_domain d
WHERE d.is_default = 1 AND d.status = 1
  AND m.`key` = 'db-meta'
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_domain_menu sdm
    WHERE sdm.domain_id = d.id AND sdm.menu_id = m.id
  );

-- 5. 仅授予超管角色（幂等）：非超管不会出现在菜单中
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r
JOIN nav_menu m ON m.`key` = 'db-meta'
WHERE r.role_code = 'ROLE_ADMIN'
  AND m.deleted = 0 AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu srm
    WHERE srm.role_id = r.id AND srm.menu_id = m.id
  );
