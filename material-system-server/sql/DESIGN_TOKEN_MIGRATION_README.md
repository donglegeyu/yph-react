# Design Token 第一阶段迁移说明

## 📋 迁移概述

本次迁移将 Design Token 从 **19 个扩展到 59 个**，新增：

- ✅ 颜色类 Token：25 个（新增 17 个）
- ✅ 字体类 Token：10 个（新增 8 个）
- ✅ 间距类 Token：6 个（新增 2 个）
- ✅ 边框类 Token：6 个（新增 3 个）
- ✅ 阴影类 Token：4 个（新增 2 个）
- ✅ 动效类 Token：8 个（新增分类）

---

## 🚀 迁移步骤

### 方式一：全新部署（推荐）

如果你的数据库是全新初始化，直接执行完整脚本：

```bash
# 1. 进入 MySQL 容器
docker exec -it material-mysql mysql -u root -proot123456

# 2. 选择数据库
USE material_system;

# 3. 执行初始化脚本
SOURCE /path/to/design_token.sql;

# 4. 验证结果
SELECT COUNT(*) AS total_tokens FROM design_token;
-- 预期结果：59

SELECT COUNT(*) AS total_categories FROM design_token_category;
-- 预期结果：7
```

### 方式二：已有数据升级

如果你的数据库已经有数据，使用迁移脚本：

```bash
# 1. 进入 MySQL 容器
docker exec -it material-mysql mysql -u root -proot123456

# 2. 选择数据库
USE material_system;

# 3. 先备份现有数据（重要！）
CREATE TABLE design_token_backup AS SELECT * FROM design_token;
CREATE TABLE design_token_category_backup AS SELECT * FROM design_token_category;

# 4. 执行迁移脚本
SOURCE /path/to/design_token_v1_migration.sql;

# 5. 验证结果
SELECT 
  c.name AS '分类名称',
  COUNT(t.id) AS 'Token 数量'
FROM design_token_category c
LEFT JOIN design_token t ON c.id = t.category_id
GROUP BY c.id, c.name
ORDER BY c.sort_order;

-- 预期输出：
-- +-----------+--------------+
-- | 分类名称   | Token 数量   |
-- +-----------+--------------+
-- | 颜色      | 25           |
-- | 字体      | 10           |
-- | 间距      | 6            |
-- | 边框      | 6            |
-- | 阴影      | 4            |
-- | 动效      | 8            |
-- | 自定义    | 0            |
-- +-----------+--------------+
```

---

## 🔄 后端重启

迁移完成后，需要重启后端服务以加载新的 Token：

```bash
# 1. 停止旧容器
docker stop material-backend

# 2. 重新构建镜像（如果需要）
docker build -t material-backend-new:latest .

# 3. 启动新容器
docker run -d --name material-backend \
  --network material-network \
  -p 8080:8080 \
  material-backend-new:latest

# 4. 检查日志
docker logs -f material-backend
```

---

## 🧪 测试验证

迁移完成后，在前端进行以下测试：

### 1. 访问 Design Token 配置页面
```
http://localhost:3002/#/component-preview?tab=tokens
```

### 2. 验证 Token 加载
打开浏览器控制台，应该看到类似输出：

```javascript
// Token 加载成功
console.log('[DesignTokens] 加载完成，共 59 个 Token')
```

### 3. 验证新 Token 生效
尝试修改以下新 Token，验证是否正常应用：

- ✅ 颜色类：`--color-success-bg`（成功背景色）
- ✅ 字体类：`--font-size-h1`（标题字号）
- ✅ 间距类：`--spacing-xl`（大间距）
- ✅ 动效类：`--motion-duration-fast`（快速动画）

### 4. 验证 Ant Design Token 映射
修改以下 Token，验证是否影响 Ant Design 组件：

| CSS Token | Ant Design Token |
|-----------|----------------|
| `--primary-color` | colorPrimary |
| `--color-text` | colorText |
| `--color-bg-container` | colorBgContainer |
| `--font-size-base` | fontSize |
| `--border-radius-base` | borderRadius |

---

## ⚠️ 注意事项

### 1. 数据备份
升级前务必备份现有 Token 数据！

```sql
-- 备份命令
CREATE TABLE design_token_backup_20260426 AS SELECT * FROM design_token;
CREATE TABLE design_token_category_backup_20260426 AS SELECT * FROM design_token_category;
```

### 2. 回滚方案
如果出现问题，可以回滚：

```sql
-- 删除新数据
DELETE FROM design_token WHERE category_id IN (SELECT id FROM design_token_category WHERE code IN ('color', 'typography', 'spacing', 'border', 'shadow', 'motion'));
DELETE FROM design_token_category WHERE code IN ('color', 'typography', 'spacing', 'border', 'shadow', 'motion');

-- 恢复备份
INSERT INTO design_token SELECT * FROM design_token_backup_20260426;
INSERT INTO design_token_category SELECT * FROM design_token_category_backup_20260426;
```

### 3. 样式影响
新增的 Token 默认值与 Ant Design 5 保持一致，理论上不会影响现有样式。

但建议在测试环境验证后再部署到生产环境。

---

## 📊 Token 分类详情

### 颜色类（25 个 Token）

| Token Key | 说明 | Ant Design 映射 |
|-----------|------|----------------|
| `--primary-color` | 主色 | colorPrimary |
| `--primary-hover` | 主色悬停 | - |
| `--primary-active` | 主色按下 | - |
| `--color-success` | 成功色 | colorSuccess |
| `--color-warning` | 警告色 | colorWarning |
| `--color-error` | 错误色 | colorError |
| `--color-info` | 信息色 | colorInfo |
| `--color-success-bg` | 成功背景色 | - |
| `--color-warning-bg` | 警告背景色 | - |
| `--color-error-bg` | 错误背景色 | - |
| `--color-info-bg` | 信息背景色 | - |
| `--color-success-border` | 成功边框色 | - |
| `--color-warning-border` | 警告边框色 | - |
| `--color-error-border` | 错误边框色 | - |
| `--color-info-border` | 信息边框色 | - |
| `--color-text` | 主文本色 | colorText |
| `--color-text-secondary` | 次要文本色 | colorTextSecondary |
| `--color-text-tertiary` | 占位文本色 | - |
| `--color-text-quaternary` | 禁用文本色 | - |
| `--color-bg-container` | 容器背景色 | colorBgContainer |
| `--color-bg-layout` | 布局背景色 | colorBgLayout |
| `--color-bg-elevated` | 抬升背景色 | - |
| `--color-bg-mask` | 遮罩背景色 | - |
| `--color-border` | 边框色 | colorBorder |
| `--color-border-secondary` | 次要边框色 | colorBorderSecondary |

### 字体类（10 个 Token）

| Token Key | 说明 | Ant Design 映射 |
|-----------|------|----------------|
| `--font-family` | 字体家族 | fontFamily |
| `--font-family-code` | 代码字体 | - |
| `--font-size-sm` | 小字号 | fontSizeSM |
| `--font-size-base` | 基础字号 | fontSize |
| `--font-size-lg` | 大字号 | fontSizeLG |
| `--font-size-h1` | 标题1字号 | fontSizeHeading1 |
| `--font-size-h2` | 标题2字号 | fontSizeHeading2 |
| `--font-size-h3` | 标题3字号 | fontSizeHeading3 |
| `--font-size-h4` | 标题4字号 | fontSizeHeading4 |
| `--line-height` | 行高 | lineHeight |

### 间距类（6 个 Token）

| Token Key | 说明 | 默认值 |
|-----------|------|--------|
| `--spacing-xxs` | 超小间距 | 4px |
| `--spacing-xs` | 小间距 | 8px |
| `--spacing-sm` | 中小间距 | 12px |
| `--spacing-md` | 中间距 | 16px |
| `--spacing-lg` | 大间距 | 24px |
| `--spacing-xl` | 超大间距 | 32px |

### 边框类（6 个 Token）

| Token Key | 说明 | Ant Design 映射 |
|-----------|------|----------------|
| `--border-radius-base` | 基础圆角 | borderRadius |
| `--border-radius-sm` | 小圆角 | borderRadiusSM |
| `--border-radius-lg` | 大圆角 | borderRadiusLG |
| `--border-radius-xs` | 超小圆角 | - |
| `--border-radius-circle` | 圆形 | - |
| `--border-width` | 边框宽度 | - |

### 阴影类（4 个 Token）

| Token Key | 说明 | 使用场景 |
|-----------|------|---------|
| `--shadow-sm` | 小阴影 | 按钮、输入框 |
| `--shadow-md` | 中等阴影 | 卡片、下拉菜单 |
| `--shadow-lg` | 大阴影 | 弹窗、抽屉 |
| `--shadow-elevated` | 浮层阴影 | 模态框 |

### 动效类（8 个 Token）

| Token Key | 说明 | 默认值 |
|-----------|------|--------|
| `--motion-duration-fast` | 快速动画时长 | 0.1s |
| `--motion-duration-mid` | 中等动画时长 | 0.2s |
| `--motion-duration-slow` | 慢速动画时长 | 0.3s |
| `--motion-ease-in-out` | 缓入缓出 | cubic-bezier(...) |
| `--motion-ease-out` | 缓出 | cubic-bezier(...) |
| `--motion-ease-in` | 缓入 | cubic-bezier(...) |
| `--motion-linear` | 线性 | linear |
| `--motion-bounce` | 弹跳 | cubic-bezier(...) |

---

## 🎯 下一步计划

第二阶段将实现：
- 组件级 Token（Button、Table、Input 等组件的精细化定制）
- 深色模式支持
- 敬请期待！

---

## 🆘 常见问题

### Q1: 迁移后页面样式乱了怎么办？
A: 立即执行回滚命令：
```sql
-- 恢复备份
DELETE FROM design_token;
INSERT INTO design_token SELECT * FROM design_token_backup_20260426;
```

### Q2: Token 没有生效？
A: 检查以下几点：
1. 后端是否重启？
2. 浏览器是否刷新缓存？（Ctrl+Shift+R 强制刷新）
3. 前端是否有报错？

### Q3: 如何查看所有 Token？
```sql
SELECT 
  t.name AS '名称',
  t.token_key AS '变量名',
  t.current_value AS '当前值',
  t.description AS '说明'
FROM design_token t
ORDER BY t.category_id, t.sort_order;
```

---

## 📞 技术支持

如有问题，请查看：
- [Design Token 管理页面](http://localhost:3002/#/component-preview?tab=tokens)
- [浏览器控制台日志](chrome://inspect/#console)
- [后端日志](docker logs material-backend)
