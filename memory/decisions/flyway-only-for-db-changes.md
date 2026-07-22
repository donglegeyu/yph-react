# 🔴 所有数据库变更必须走 Flyway（最高优先级）

> Last updated: 2026-07-22
> Priority: **CRITICAL / 红线**

## 决策

**任何数据库变更（建表、加字段、改数据、删数据）都必须且只能通过 Flyway 迁移脚本完成。**

没有例外，没有"临时手动改一下"。

## 适用范围

| 场景 | 正确做法 | ❌ 禁止做法 |
|------|---------|-----------|
| 加字段 | 新建 `V{N}__xxx.sql` | `docker exec mysql ALTER TABLE ...` |
| 修数据 | 新建 `V{N}__xxx.sql` | `docker exec mysql UPDATE ...` |
| 清理脏数据 | 新建 `V{N}__xxx.sql` | 直接在 Navicat / 命令行里改 |
| 线上紧急修复 | 新建 `V{N}__xxx.sql` + 部署 | 绕过 Flyway 手动改库 |
| 本地调试 | 新建 `V{N}__xxx.sql` | `docker exec mysql` 改完不走脚本 |

## 规则

1. **脚本位置**：`material-system-server/src/main/resources/db/migration/`
2. **命名格式**：`V{版本号}__{描述}.sql`（两个下划线）
3. **版本号全局唯一且递增**，不能回头用已用过的版本号
4. **脚本必须幂等**（可重复执行不出错）：
   - 建表用 `CREATE TABLE IF NOT EXISTS`
   - 加字段用 `SET @col_exists` 判断
   - 插数据用 `INSERT ... WHERE NOT EXISTS`
   - 改数据用条件判断避免重复执行
5. **脚本一旦执行过，绝对不能修改内容**（Flyway 校验 checksum）
   - 需要修改就新建更高版本号的脚本
6. **禁止关闭 Flyway**（`spring.flyway.enabled=false`）来绕过迁移失败

## 为什么这是红线

- Flyway 迁移链是数据库演进的**唯一真相源**
- 手动改库会导致：本地 ↔ 线上数据库结构不一致 → 排查问题极其困难
- 一旦绕过 Flyway，后续所有迁移都可能出问题（checksum 不匹配 → 后端启动失败）

## 验证当前数据库版本

```bash
docker exec -i material-mysql-react mysql -uroot -proot123456 material_system_react -e \
  "SELECT version, description, script, success FROM flyway_schema_history ORDER BY version;"
```

## 参考模板

- 基线：`V1__baseline.sql`
- 幂等模板：`V2__example_template.sql`
