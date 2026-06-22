# Errors Index

> 错误复盘与预防（框架无关）

| Error | Scene | File |
|-------|-------|------|
| 数组越界 | 数组索引超出范围导致 TypeError | [array-out-of-bounds.md](./array-out-of-bounds.md) |
| 数据库菜单配置 | nav_menu level/icon 字段配置错误 | [database-menu-config-errors.md](./database-menu-config-errors.md) |
| TypeScript 类型 | 类型推断失败、undefined/null 处理 | [typescript-errors.md](./typescript-errors.md) |
| G2 图表样式配置 | axis label 颜色显示浅，labelOpacity 默认透明度坑 | [g2-chart-style-config.md](./g2-chart-style-config.md) |
| Vite 依赖缓存 | 升级组件库后项目未生效，需清理 .vite/deps 缓存 | [vite-deps-cache.md](./vite-deps-cache.md) |
| Git 冲突未告知 | merge/stash pop 遇冲突必须先告知用户，不可自行决定 | [git-conflict-notify.md](./git-conflict-notify.md) |
| portal 样式丢失 | Drawer/Modal 内 antd 组件样式异常，ConfigProvider theme 链断裂 | [portal-configprovider-theme.md](./portal-configprovider-theme.md) |
| Flyway 与 MySQL 5.7 不兼容 | 服务器 MySQL 5.7 跑不动 Flyway 9.x，必须降级到 7.15.0 | [flyway-mysql57-incompatible.md](./flyway-mysql57-incompatible.md) |
