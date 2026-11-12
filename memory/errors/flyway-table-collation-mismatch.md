# Flyway 新建表 collation 不一致导致 join 报错

> Last updated: 2026-11-11

## 现象

approval-server V3 脚本新建 `appr_cc` 表未显式指定 COLLATE，MySQL 8 默认给了 `utf8mb4_0900_ai_ci`；而 V1/V2 建的 `appr_business_link`/`appr_task_action` 是 `utf8mb4_unicode_ci`。cc/mine 接口的 LEFT JOIN 直接报：

```
ERROR 1267 (HY000): Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT) and (utf8mb4_0900_ai_ci,IMPLICIT) for operation '='
```

单表查询一切正常，**只有跨表 join 才炸**，容易在联调后期才暴露。

## 解决

V4 脚本 `ALTER TABLE appr_cc CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`（CONVERT TO 幂等，重复执行无副作用）。

## 预防

- approval-server 的 Flyway 脚本建表**一律显式** `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`，与库内既有表保持一致
- 新建表后若接口里有 join，冒烟测试要覆盖 join 路径，不能只测单表
- V3 已执行不能改内容（checksum），只能加更高版本号修复
