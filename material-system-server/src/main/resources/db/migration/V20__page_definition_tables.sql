-- ============================================================
-- V20__page_definition_tables.sql
-- 页面生成器：存储用户通过向导生成的业务列表页配置
-- 完整 schema 以 JSON 形式保存（与前端 PageDefinitionDTO 对齐）
-- 发布时联动 nav_menu 表（新建子菜单或更新已有菜单 path）
-- ============================================================

CREATE TABLE IF NOT EXISTS page_definition (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  page_key VARCHAR(100) NOT NULL COMMENT '页面 key（唯一，用于路由 /dynamic/{pageKey}）',
  page_name VARCHAR(100) NOT NULL COMMENT '页面名称',
  template_type VARCHAR(50) DEFAULT 'smart-list' COMMENT '模板类型',
  table_name VARCHAR(100) COMMENT '业务表名',
  api_prefix VARCHAR(200) COMMENT 'API 前缀',
  menu_link_mode VARCHAR(20) DEFAULT 'new_child' COMMENT '菜单挂载方式: new_child | bind_existing',
  parent_menu_id BIGINT COMMENT '父菜单 id（new_child 模式使用）',
  bind_menu_id BIGINT COMMENT '要绑定路径的已有菜单 id（bind_existing 模式使用）',
  schema_json MEDIUMTEXT COMMENT '完整 PageDefinitionDTO JSON',
  status VARCHAR(20) DEFAULT 'draft' COMMENT '状态: draft | published',
  created_by VARCHAR(50) COMMENT '创建人',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
  UNIQUE KEY uk_page_key (page_key),
  INDEX idx_status (status),
  INDEX idx_parent_menu (parent_menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面生成器 - 页面定义';
