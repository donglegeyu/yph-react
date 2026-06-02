# 项目修复与功能开发对话记录

> 项目路径：`/Users/xiongdongying/ai_project/yph-vue/`
> 前端：`/Users/xiongdongying/ai_project/yph-vue/material-system/` (Vue 3 + Vite + Ant Design Vue)
> 后端：`/Users/xiongdongying/ai_project/yph-vue/material-system-server/` (Spring Boot + MyBatis-Plus)
> 前端端口：3007，后端端口：8080
> 默认登录：admin / admin123

---

## 1. MySQL 数据持久化（容器重启数据丢失）

### 问题
MySQL 容器使用匿名数据卷，`docker rm` 重建容器时数据全部丢失。

### 解决
创建 `docker-compose.yml`，使用**命名数据卷** `material-mysql-data` 持久化 MySQL 数据。

### 关键文件
- [docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/docker-compose.yml)
- [init/README.md](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/init/README.md)

### 注意事项
- `docker compose down`（不带 `-v`）→ 保留数据，仅重启容器
- `docker compose down -v` → **清空所有数据卷，数据全部丢失**
- `init/` 目录下的 SQL 脚本在首次启动时按文件名顺序执行

---

## 2. 中文乱码修复

### 问题
MySQL 客户端连接默认字符集为 `latin1`，初始化脚本写入中文时被错误编码存储。

### 解决
在 `docker-compose.yml` 的 MySQL command 中添加 `--character-set-client-handshake=FALSE`，强制服务端忽略客户端字符集声明，统一使用 `utf8mb4`。

### 文件变更
- [docker-compose.yml](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/docker-compose.yml)

---

## 3. 菜单图标映射修复

### 问题
后端返回的图标名（如 `buy`、`file`、`search`、`user`、`safe`、`tool`、`app`）在 CDN IconPark 和本地 sprite 中不存在，导致侧边栏图标显示空白。另有 `commodity` 映射到 `tag` 导致笔画变细。

### 解决
统一 `iconMap` 映射逻辑：

```typescript
const iconMap = {
  'shopping': 'shopping-cart-del',
  'goods': 'tag',
  'file': 'file-cabinet',       // → CDN 存在
  'search': 'find',             // → CDN 存在
  'user': 'people-top-card',    // → CDN 存在
  'safe': 'message-security',   // → CDN 存在
  'tool': 'setting',            // → CDN 存在
  'app': 'all-application',     // → CDN 存在
}
```

`commodity` 和 `buy` 在 CDN 中本来就存在，删除了原来错误的映射。

### 文件变更（4 个文件同步修改）
- [FirstSidebar.vue](file:///Users/xiongdongying/ai_project/yph-vue/material-system/src/components/layout/FirstSidebar.vue)
- [SecondSidebar.vue](file:///Users/xiongdongying/ai_project/yph-vue/material-system/src/components/layout/SecondSidebar.vue)（原来漏了，后来补上）
- [MoreMenuDrawer.vue](file:///Users/xiongdongying/ai_project/yph-vue/material-system/src/components/layout/MoreMenuDrawer.vue)
- [CustomNavPanel.vue](file:///Users/xiongdongying/ai_project/yph-vue/material-system/src/components/layout/CustomNavPanel.vue)

---

## 4. 菜单二级面板不更新

### 问题
在菜单管理修改层级后，左侧导航的二级菜单面板没有同步更新。

### 解决
移除 `stores/app.ts` 中的 `menusLoaded` 缓存守卫，`fetchMenus()` 每次调用都从 API 获取最新数据。

### 文件变更
- [app.ts](file:///Users/xiongdongying/ai_project/yph-vue/material-system/src/stores/app.ts) — 删除 `menusLoaded` 变量及缓存判断逻辑

---

## 5. 图标选择器（IconSelect）修复

### 问题
- `icon_config` 表预设仅有 16 个图标，缺少 `user`、`file`、`search` 等常用菜单图标
- IconSelect 直接渲染 `<use href="#user" />`，但 CDN 无此图标，预览空白

### 解决
1. 新增 11 个预设图标到数据库 + SQL 文件
2. 为 [IconSelect.vue](file:///Users/xiongdongying/ai_project/yph-vue/material-system/src/components/IconSelect.vue) 添加 `iconMap` + `getIconName` 映射

### 新增预设图标
`user` → `people-top-card`、`file` → `file-cabinet`、`search` → `find`、`safe` → `message-security`、`tool` → `setting`、`app` → `all-application` + 原始映射名 `find`、`people-top-card`、`file-cabinet`、`message-security`、`all-application`

### 文件变更
- [IconSelect.vue](file:///Users/xiongdongying/ai_project/yph-vue/material-system/src/components/IconSelect.vue)
- [05-icon-config.sql](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/init/05-icon-config.sql)
- [icon_config.sql](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/sql/icon_config.sql)

---

## 6. Design Tokens 加载失败恢复

### 问题
`docker compose down -v` 清空了数据库，但初始化 SQL 中没有 `design_token` / `design_token_category` / `component_token` 三张表的建表语句和数据，导致 API 500 错误。

### 解决
新建 [11-init-design-tokens.sql](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/init/11-init-design-tokens.sql)，包含：
- `design_token_category` 建表
- `design_token` 建表（含 is_ant_design_token、ant_design_token_name）
- `component_token` 建表
- 7 个分类的初始数据
- 62 个 Token 的完整数据

### 分类与 Token 数
| 分类 | Tokens |
|------|--------|
| 基础色阶 (base-color) | 50（5组×10） |
| 颜色 (color) | 25（含 7 个主色 token） |
| 字体 (typography) | 10 |
| 间距 (spacing) | 6 |
| 边框 (border) | 6 |
| 阴影 (shadow) | 4 |
| 动效 (motion) | 8 |
| **总计** | **≈109** |

---

## 7. 基础色阶显示不全

### 问题
基础色阶只显示编号"0"，其他 9 个色块不显示。
**根因**：`getTokensGrouped` 用 `description` 字段分组，10 个 token 的 description 是 `主色色阶1`~`主色色阶10`（各不相同），每个 token 自成一"组"，每组渲染为 1 个色块。

### 解决
将 description 统一为 `主色色阶`，10 个 token 归为一组正常渲染。同时新增成功色、警告色、错误色、信息色四组色阶（每组 10 个，共 50 个色阶 token）。

### 文件变更
- 数据库 `UPDATE` 修复
- [11-init-design-tokens.sql](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/init/11-init-design-tokens.sql)
- [add_base_color_scale.sql](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/sql/add_base_color_scale.sql)

---

## 8. 颜色分类缺少主色 Token

### 问题
颜色(tab)下有成功色、警告色等分组，但缺少"主色"分组。

### 解决
为 color 分类插入 sort_order=1~7 的主色 token
- `--primary-color`（主题主色，colorPrimary）
- `--primary-hover`（主色悬浮态，colorPrimaryHover）
- `--primary-active`（主色激活态，colorPrimaryActive）
- `--primary-bg`（主色背景）
- `--primary-border`（主色边框）
- `--primary-text`（主色文本）
- `--primary-bg-light`（主色浅背景）

### 文件变更
- 数据库 `INSERT` 修复
- [11-init-design-tokens.sql](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/init/11-init-design-tokens.sql)

---

## 9. 菜单 level 值修复

### 问题
初始化 SQL 中 `INSERT INTO nav_menu` 没有包含 `level` 列，所有菜单 level = 0。

### 解决
在所有初始化脚本末尾添加 level 递归修复语句：
```sql
UPDATE nav_menu SET level = 0 WHERE parent_id IS NULL OR parent_id = 0;
UPDATE nav_menu SET level = 1 WHERE parent_id IN (...) AND parent_id != 0;
UPDATE nav_menu SET level = 2 WHERE parent_id IN (SELECT id FROM nav_menu WHERE level = 1);
UPDATE nav_menu SET level = 3 WHERE parent_id IN (SELECT id FROM nav_menu WHERE level = 2);
```

### 文件变更
- [01-schema-correct.sql](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/init/01-schema-correct.sql)
- [10-init-system-data.sql](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/init/10-init-system-data.sql)
- [schema-correct.sql](file:///Users/xiongdongying/ai_project/yph-vue/material-system-server/sql/schema-correct.sql)

---

## 10. 系统设置/组件预览从二级面板隐藏

### 问题
"系统设置"和"组件预览"是固定链接页面，不需要在二级侧边栏展示，但仍在菜单管理中保留管理入口。

### 解决
在 [SecondSidebar.vue](file:///Users/xiongdongying/ai_project/yph-vue/material-system/src/components/layout/SecondSidebar.vue) 的 `secondMenus` computed 中添加过滤逻辑：

```typescript
const hideKeys = ['system-settings', 'component-preview']
return (currentSecondMenus.value || [])
  .filter((menu: any) => !hideKeys.includes(menu.key))
```

---

## 常用命令

```bash
# 启动（保留数据）
cd material-system-server && docker compose up -d

# 停止（保留数据）
docker compose down

# 完全重置（清空数据重新初始化）
docker compose down -v && docker compose up -d

# 重启后端
docker compose restart backend

# 重启前端（material-system 目录下）
lsof -ti :3007 | xargs kill -9
npx vite --port 3007 --host 0.0.0.0 &
```

---

> 生成时间：2026-06-02
