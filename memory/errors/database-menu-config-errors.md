# 数据库菜单配置错误复盘

## 错误类型
数据库菜单层级配置错误、图标配置错误

## 错误描述

### 错误 1：菜单 level 字段设置错误
**发生日期**：2026-04-24
**影响**：组件预览菜单显示为一级菜单，而非预期的三级菜单

**错误代码**：
```sql
-- 错误的配置
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type) 
VALUES ('component-preview', '组件预览', '/component-preview', 'app', 1, 1, 45, '业务菜单');
-- 注意：没有指定 level 字段，导致使用了默认值或错误的值
```

**正确代码**：
```sql
-- 正确的配置
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type, level) 
VALUES ('component-preview', '组件预览', '/component-preview', NULL, 1, 1, 45, '业务菜单', 2);
```

**根因分析**：
- 插入语句中缺少 level 字段
- 没有检查数据库 schema 中 level 的默认值
- 没有参考同类型菜单的配置

### 错误 2：三级菜单设置了图标
**发生日期**：2026-04-24
**影响**：组件预览左侧显示图标，与其他三级菜单不一致

**错误代码**：
```sql
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type, level) 
VALUES ('component-preview', '组件预览', '/component-preview', 'app', 1, 1, 45, '业务菜单', 2);
```

**正确代码**：
```sql
INSERT INTO nav_menu (`key`, label, path, icon, sort, status, parent_id, menu_type, level) 
VALUES ('component-preview', '组件预览', '/component-preview', NULL, 1, 1, 45, '业务菜单', 2);
```

**根因分析**：
- 没有查询现有三级菜单的 icon 配置
- 假设所有菜单都需要图标

---

## 教训总结

### 1. 新增菜单前必须查询现有菜单配置
```sql
-- 查询指定层级的所有菜单及其配置
SELECT id, label, icon, parent_id, level 
FROM nav_menu 
WHERE level = 2 AND deleted = 0
ORDER BY parent_id, sort;
```

### 2. 插入语句必须包含所有关键字段
```sql
INSERT INTO nav_menu (
  `key`, label, path, icon, sort, status, parent_id, menu_type, level
) VALUES (
  'your-key', '菜单名称', '/path', NULL, 1, 1, parent_id, '业务菜单', level
);
```

### 3. 插入后必须验证
```sql
-- 验证新增菜单的配置是否正确
SELECT 
  m.id,
  m.label,
  m.icon,
  m.parent_id,
  m.level,
  p.label as parent_label
FROM nav_menu m
LEFT JOIN nav_menu p ON m.parent_id = p.id
WHERE m.id = NEW_ID;
```

---

## 预防措施

### 1. 创建菜单配置检查清单
- [ ] 确定菜单的父级菜单 ID (parent_id)
- [ ] 确定菜单的层级 (level)
- [ ] 确定是否需要图标 (icon)
- [ ] 确定菜单类型 (menu_type)
- [ ] 确定排序 (sort)
- [ ] 编写完整的 INSERT 语句
- [ ] 执行插入后验证配置

### 2. 创建菜单配置模板
```sql
-- 模板：新增菜单 INSERT 语句
INSERT INTO nav_menu (
  `key`, label, path, icon, sort, status, parent_id, menu_type, level
) VALUES (
  'PLACEHOLDER_KEY',      -- 唯一标识，英文
  '菜单名称',              -- 显示名称，中文
  '/path',               -- 路由路径（叶子菜单必须有）
  NULL,                  -- 图标（三级菜单必须为 NULL）
  1,                     -- 排序
  1,                     -- 状态（1=启用）
  PARENT_ID,             -- 父级菜单 ID
  '业务菜单',              -- 菜单类型
  LEVEL                  -- 层级（一级=0，二级=1，三级=2）
);
```

### 3. 创建验证查询模板
```sql
-- 验证新增菜单的层级结构
WITH RECURSIVE menu_tree AS (
  SELECT id, label, parent_id, level, icon, 0 as depth
  FROM nav_menu WHERE parent_id = 0 AND deleted = 0
  UNION ALL
  SELECT m.id, m.label, m.parent_id, m.level, m.icon, mt.depth + 1
  FROM nav_menu m
  JOIN menu_tree mt ON m.parent_id = mt.id
  WHERE m.deleted = 0
)
SELECT * FROM menu_tree ORDER BY depth, sort;
```

---

## 相关错误记录
- 关联项目：material-system
- 相关模块：菜单管理
- 修复日期：2026-04-24
- 修复人员：AI Assistant
