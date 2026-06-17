# 菜单配置规范

> Last updated: 2026-06-16

## 概述
本文档定义了逸品汇中台系统中导航菜单的配置规范，包括数据库字段说明、层级定义、图标规范等。

## 菜单结构

### 菜单层级
```
一级菜单 (level = 0)
└── 二级菜单 (level = 1)
    └── 三级菜单 (level = 2)
```

### 现有菜单结构示例
```sql
系统中心 (ID=10, level=0)
├── 域/菜单管理 (ID=44, level=1)
│   ├── 菜单管理 (ID=46, level=2)
│   └── 域管理 (ID=47, level=2)
├── 系统设置 (ID=45, level=1)
│   └── 组件预览 (ID=77, level=2)
└── 导航管理 (ID=49, level=1)
```

## nav_menu 表结构

### 字段说明
| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| id | BIGINT | 是 | 主键ID | 1 |
| `key` | VARCHAR(50) | 是 | 菜单唯一标识 | material-apply |
| label | VARCHAR(100) | 是 | 显示名称 | 材料申请 |
| path | VARCHAR(200) | 否 | 路由路径 | /materials |
| icon | VARCHAR(50) | 否 | 图标名称 | folder |
| sort | INT | 否 | 排序号 | 1 |
| status | TINYINT | 否 | 状态：0禁用 1启用 | 1 |
| parent_id | BIGINT | 是 | 父菜单ID | 0 |
| menu_type | VARCHAR(50) | 否 | 菜单类型 | 业务菜单 |
| level | INT | 否 | 菜单层级 | 0 |
| create_time | DATETIME | 否 | 创建时间 | 2024-01-01 |
| update_time | DATETIME | 否 | 更新时间 | 2024-01-01 |
| deleted | TINYINT | 否 | 逻辑删除 | 0 |

## 字段配置规范

### 1. level 字段（菜单层级）
**必填字段，必须根据实际位置设置**

```sql
-- 一级菜单（parent_id = 0）
INSERT INTO nav_menu (..., level) VALUES (..., 0);

-- 二级菜单（parent_id = 一级菜单ID）
INSERT INTO nav_menu (..., level) VALUES (..., 1);

-- 三级菜单（parent_id = 二级菜单ID）
INSERT INTO nav_menu (..., level) VALUES (..., 2);
```

**常见错误**：
- ❌ 新增三级菜单时没有指定 level，导致使用默认值
- ❌ level 值与实际层级不符

### 2. icon 字段（图标）
**三级菜单必须为 NULL**

```sql
-- 一级/二级菜单可以设置图标
INSERT INTO nav_menu (icon) VALUES ('folder');

-- 三级菜单必须为 NULL
INSERT INTO nav_menu (icon) VALUES (NULL);
```

### 3. parent_id 字段（父菜单ID）
**必须指向正确的父菜单**

```sql
-- 首先查询父菜单的 ID
SELECT id, label FROM nav_menu WHERE label = '系统设置';
-- 假设返回 id = 45

-- 然后在插入子菜单时使用这个 ID
INSERT INTO nav_menu (parent_id) VALUES (45);
```

### 4. menu_type 字段（菜单类型）
**可选值**：

| 类型值 | 说明 | 示例 |
|--------|------|------|
| 业务菜单 | 普通业务功能菜单 | 材料申请、采购订单 |
| 系统菜单-上 | 顶部系统菜单 | 首页、收藏 |
| 系统菜单-下 | 底部系统菜单 | 超级搜索 |

### 5. path 字段（路由路径）
**叶子菜单（没有子菜单）必须有 path**

## 新增菜单流程

### 步骤 1：查询父菜单信息
```sql
SELECT id, label, level 
FROM nav_menu 
WHERE label = '目标父菜单名称' AND deleted = 0;
```

### 步骤 2：编写 INSERT 语句（幂等模式）
```sql
-- ⚠️ 必须使用 WHERE NOT EXISTS 保证幂等
INSERT INTO nav_menu (
  `key`, label, path, icon, sort, status, parent_id, menu_type, level
) 
SELECT 'your-key', '菜单名称', '/path', NULL, 1, 1, PARENT_ID, '业务菜单', LEVEL
WHERE NOT EXISTS (SELECT 1 FROM nav_menu WHERE `key` = 'your-key');
```

### 步骤 3：验证插入结果
```sql
SELECT 
  m.id, m.`key`, m.label, m.path, m.icon, m.level,
  p.label as parent_label
FROM nav_menu m
LEFT JOIN nav_menu p ON m.parent_id = p.id
WHERE m.id = 新增菜单ID;
```

### 步骤 4：更新前端路由
React 项目中，菜单的 path 对应 [react-system/src/router/index.tsx](../../react-system/src/router/index.tsx) 中的路由配置。

## 检查清单

新增菜单时，必须检查：

- [ ] 确认父菜单的 ID (parent_id)
- [ ] 确认菜单的层级 (level)
  - 一级菜单：level = 0
  - 二级菜单：level = 1
  - 三级菜单：level = 2
- [ ] 确认图标配置 (icon)
  - 一级/二级菜单：可选
  - 三级菜单：必须为 NULL
- [ ] 确认菜单类型 (menu_type)
- [ ] 确认排序号 (sort)
- [ ] 使用 WHERE NOT EXISTS 幂等模式
- [ ] 执行插入后验证配置
- [ ] 如果有 path，更新前端路由映射

## 相关文档

- [数据库菜单配置错误复盘](../errors/database-menu-config-errors.md)
- 运维规范：[.trae/rules.d/ops-rules.md](../../.trae/rules.d/ops-rules.md)（init SQL 幂等规范）
