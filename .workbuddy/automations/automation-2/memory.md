# 功能开发文档自动更新 - 执行记录

## 执行历史

### 2026-04-17 (v3.2)
- 扫描 views/、stores/、router/、controller/、entity/、service/ 核心目录
- 版本升至 v3.2，主要更新：
  - 新增 MaterialView 模块（Controller/Service/Impl/Mapper/Entity + SQL）
  - MaterialList.vue 视图管理功能接入 /api/material-views 后端
  - PurchaseOrderServiceImpl.java 标注已补全（v3.1 缺失）
  - 后端目录结构补充 MaterialView 相关文件
  - 待办清单更新（PurchaseOrderServiceImpl 已勾除）

### 2026-04-10 (v2.1)
- 扫描 views/、stores/、router/ 核心目录
- 版本升至 v2.1，主要更新：
  - 新增 SecondSidebar.vue 二级导航组件文档
  - 主题色更新为 #FF5722（旧的 #F95914）
  - 基础设置/导航管理路由补录到系统中心
  - 布局组件说明表补充完整（5个组件）
  - `src/api/` 目录不存在，补充警告说明
  - 导航色/文字色规范独立章节
  - 菜单创建 Checklist 移入调试章节
  - 用户约定补充网站链接/Git SSH 规范
