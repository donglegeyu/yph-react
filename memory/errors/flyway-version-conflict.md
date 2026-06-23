> Last updated: 2026-06-23

# Flyway 版本号冲突导致后端启动失败

## 问题

后端重启后 Flyway 迁移报错，后端无法启动：

```
Caused by: org.flywaydb.core.api.FlywayException: Found more than one migration with version 12
Offenders:
-> V12__restructure_training_menus.sql
-> V12__craftsman_add_source_channel.sql
```

## 根因

`db/migration/` 目录下出现了两个 `V12` 脚本（版本号重复）：
- `V12__craftsman_add_source_channel.sql`（数据库已执行）
- `V12__restructure_training_menus.sql`（后加的，未执行，版本号撞车）

Flyway 要求版本号全局唯一，重复直接抛异常阻断启动。

## 修复方式

把未执行的冲突脚本重命名为下一个可用版本号（当前最大已用版本 +1）：
```bash
mv V12__restructure_training_menus.sql V15__restructure_training_menus.sql
```

## 排查命令

```bash
# 看所有迁移脚本版本号
ls -1 src/main/resources/db/migration/ | sort

# 看数据库已执行的版本
docker exec -i material-mysql-react mysql -uroot -proot123456 material_system_react -e \
  "SELECT version, description, script, success FROM flyway_schema_history ORDER BY version;"
```

## 教训

- 新建 Flyway 脚本前，**必须先 ls 目录确认最大版本号**，不要凭记忆猜
- 版本号撞车不会在开发期暴露（因为旧镜像缓存里没有新脚本），只有重新构建镜像部署时才触发
- 重命名脚本文件是安全的（只要脚本内容幂等），因为 Flyway 按文件名的版本号识别，不依赖文件历史
