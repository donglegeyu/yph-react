# Decisions Index

> 重大技术决策记录（ADR）

| ID | Decision | Status | File |
|----|----------|--------|------|
| D002 | 使用可选链（?.）防止数组越界和空指针 | Active | [optional-chaining.md](./optional-chaining.md) |
| D003 | 新建文档按受众选择存放位置（docs/ vs memory/ vs .trae/） | Active | [doc-location-rules.md](./doc-location-rules.md) |
| D004 | 🔴 运维的 Dockerfile、application.yml 等部署文件不可改动（红线） | Active | [ops-files-readonly.md](./ops-files-readonly.md) |
| D005 | 证件类型独立成表（certificate_type），与图片记录解耦 | Active | [certificate-type-table.md](./certificate-type-table.md) |
| D006 | 🔴🔴 所有数据库变更必须走 Flyway，禁止手动改库（最高优先级红线） | Active | [flyway-only-for-db-changes.md](./flyway-only-for-db-changes.md) |
| D007 | 页面生成器本轮迭代只改详情页模板，不碰列表页配置（会话级） | Active | [generator-detail-only-scope.md](./generator-detail-only-scope.md) |
| D008 | 🔴 页面生成器只在默认域落地，其他域手工开启（长期策略；菜单为多域共享记录） | Active | [generator-domain-scope.md](./generator-domain-scope.md) |
| D009 | 🔴 新增一律 Drawer；编辑按内容多少在 Drawer / 独立页面间二选一；二次确认才用 Modal | Active | [modal-drawer-page-choice.md](./modal-drawer-page-choice.md) |
