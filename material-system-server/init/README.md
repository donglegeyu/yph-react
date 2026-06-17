# 数据库初始化脚本

此目录下的 SQL 脚本在 MySQL 容器首次启动时（数据卷为空）按文件名顺序自动执行。
由 `docker-compose.yml` 中 MySQL 服务的 `volumes` 配置挂载到 `/docker-entrypoint-initdb.d` 目录。

## 执行顺序

| 文件名 | 内容 | 说明 |
|--------|------|------|
| `01-schema-correct.sql` | 核心表结构 | `material_application`、`nav_menu`、`sys_tag` 等（菜单数据已迁出） |
| `02-sys-permission.sql` | 权限系统表 | `sys_user`、`sys_domain`、`sys_domain_menu`、`sys_permission` 等 + 默认域 |
| `03-favorite.sql` | 收藏表 | `favorite` 表结构 |
| `04-user-preference.sql` | 用户偏好表 | `user_preference` 表结构 |
| `05-icon-config.sql` | 图标配置表 | `icon_config` 表结构 + 默认预设图标 |
| `06-construction-application.sql` | 施工申请表 | `construction_application` 表结构 + 测试数据（菜单已迁出） |
| `07-material-view.sql` | 材料视图表 | `material_view` 表结构 |
| `08-menu-view.sql` | 菜单视图表 | `menu_view` 表结构 |
| `09-init-data.sql` | 材料申请测试数据 | 5 条材料申请示例数据 |
| `09-menu-seed.sql` | **菜单种子数据（唯一来源）** | 全量 nav_menu + 末尾统一同步默认域 sys_domain_menu |
| `10-init-system-data.sql` | 系统初始化数据 | 创建 admin 用户并关联默认域 |

> **菜单维护规则**：新增/修改菜单只改 `09-menu-seed.sql`，不要再往其他文件里写 `INSERT INTO nav_menu`。

## 何时重建

以下命令会**删除所有数据卷**（MySQL 数据、手动添加的菜单、用户配置等全部丢失）：

```bash
docker compose down -v
```

之后重新启动将**从头执行所有初始化脚本**，只包含脚本中预设的数据。

以下命令**保留数据**，仅重启容器：

```bash
docker compose down        # 停止，保留数据
docker compose restart     # 原地重启
docker compose up -d       # 启动/重建容器，保留数据
```

## 新增脚本注意事项

1. 文件名以两位数字开头控制执行顺序（如 `11-xxx.sql`）
2. 使用 `CREATE TABLE IF NOT EXISTS` 避免重复建表
3. 使用 `INSERT ... WHERE NOT EXISTS` 避免重复插入
4. 不要包含 `CREATE DATABASE` 或 `USE` 语句（MySQL 自动选择 `material_system` 数据库）
5. 使用动态子查询获取父级 ID，避免硬编码数字
