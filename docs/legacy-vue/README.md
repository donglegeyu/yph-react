# Legacy Vue 文档归档

> ⚠️ **本目录下所有文档均为 Vue 3 时代的遗留产物，已于 2026-06-16 从 docs/ 根目录归档至此。**

## 背景

本项目（yph-react）已从 Vue 3 + Ant Design Vue 迁移到 React 19 + Ant Design 6。
当前项目入口文档为根目录的 [CLAUDE.md](../../CLAUDE.md)，技术栈、端口、数据库均以 CLAUDE.md 为准。

## 与当前 React 项目的差异

| 维度 | 本目录 Vue 文档（已废弃） | 当前 React 项目（CLAUDE.md） |
|------|------------------------|---------------------------|
| 前端框架 | Vue 3.5 + Ant Design Vue 4 | React 19.2 + Ant Design 6 + company-ui |
| 状态管理 | Pinia | Zustand 5 |
| 前端端口 | 3000 / 3002 | 3001 |
| 后端端口 | 8080 | 8081 |
| 数据库 | material_system | material_system_react |
| MySQL 容器 | material-mysql | material-mysql-react |
| 前端目录 | material-system/src | react-system/src |
| 组件文件 | *.vue（Composables） | *.tsx（Hooks） |

## 归档清单

| 原路径 | 说明 |
|-------|------|
| 项目文档/ | v3.1 项目文档（Vue 3.5 + TS） |
| 功能开发文档/ | v5.0 功能开发文档（Vue 3 + Ant Design Vue 4） |
| API手册.md | v1.0 自动生成 API 文档（仅 /api/materials） |
| 开发手册.md | v4.0 自动合并文档 |
| 自动文档系统.md | Storybook + Vue 自动文档系统说明 |
| 前端代码审查报告-20260427.md | Vue 组件审查（.vue 文件，228 处 !important） |
| generated/ | 自动文档系统产物（api-docs.json, components.json, database.md） |

## 使用建议

- ❌ **不要**根据这些文档配置开发环境（端口、数据库等信息已过时）
- ❌ **不要**将这里的规范用于当前 React 开发
- ✅ **可以**参考业务逻辑设计、数据模型设计等与技术栈无关的部分
- ✅ Vue 项目本身仍在 `/Users/xiongdongying/ai_project/yph-vue/material-system` 独立运行
