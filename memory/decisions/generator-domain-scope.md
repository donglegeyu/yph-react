# D008: 页面生成器只在默认域落地，其他域手工开启（长期策略）

> Last updated: 2026-10-30
> Status: Active（长期策略，不是临时限制）

## 决策

1. **菜单是共享资源**：`nav_menu` 中一条菜单为多个域共用同一条记录，域通过 `sys_domain_menu` 加关联，并用 `custom_parent_id` / `custom_level` 表达域内层级差异。
2. **页面生成器新建的菜单只关联默认域**，其他域需要在「域管理」中手工为该菜单开启关联。
3. 「其他域手工开启」是**长期策略**，不是当前阶段的临时限制。因此不得为 `page_definition` 增加 `domain_id` 做域隔离。

## 派生约束

- **禁止无脑物理删除共享菜单**：取消发布 / 删除页面配置前，需按 `sys_domain_menu` 引用计数判断——仅本域引用才可删；仍被其他域引用时，只撤本域关联，菜单本身保留。
- **`nav_menu.path` 是全局列**：`bind_existing` 改写 path 会影响所有引用该菜单的域入口；改写与还原前必须先比对当前值是否由本流程写入，避免覆盖人工配置。
- **需区分菜单来源**：`nav_menu` 要能区分「页面生成器创建」与「人工创建」，删除流程只允许删除前者。
- **第二阶段（AI 对话生成）的确认界面必须显式提示「此页面仅默认域可见」，并提供前往域管理开启其他域的入口**，避免用户误以为跨域不可见是缺陷。

## 背景

2026-10-30 与用户确认：第一阶段页面生成器的目标域行为如此；此前审查报告中「page_definition 加 domain_id、菜单 key 带域」的修法基于错误假设，已作废。

## 相关文件

- [PageDefinitionServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/PageDefinitionServiceImpl.java)
- [NavMenuServiceImpl.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/service/impl/NavMenuServiceImpl.java)
- [V20__page_definition_tables.sql](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/resources/db/migration/V20__page_definition_tables.sql)
