# 自动化执行历史

## 2026-04-22 09:00

- **任务**: 扫描项目文件结构，更新功能开发文档
- **执行结果**: 成功
- **更新内容**:
  - 版本从 v3.8 升级到 v3.9
  - **新增 MenuView 菜单视图管理模块**：后端五层完整 CRUD（Controller/Service/ServiceImpl/Mapper/Entity），API `/api/menu-views`，DB 表 `menu_view`，含初始化脚本 menu_view.sql + menu_view_init.sh
  - **MaterialApplication 实体新增 quantity 字段**：3 个 SQL 脚本（add/add_quantity/update_quantity）
  - **后端本地开发环境完善**：application-local.yml、setup-local-db.sh、start-server-local.sh/start-server.sh、IDEA run config
  - 后端统计：Java 文件 26→38 个，SQL 文件 6→10 个，新增 config/CorsConfig.java
  - git 未提交变更更新：MaterialApplication entity/schema-correct/SmartListTemplate/SecondSidebar/MaterialList 有修改
  - 待办清单同步：MenuView 后端标记完成，新增"菜单管理视图管理前端接入"待办
  - 路由数量确认：41 条动态路由（index.ts DYNAMIC_ROUTES + pathComponentMap.ts map 一致）
  - 文档同步写入 artifact 目录
- **文件更新**: `docs/功能开发文档.md`

## 2026-04-21 09:00

- **任务**: 扫描项目文件结构，更新功能开发文档
- **执行结果**: 成功
- **更新内容**:
  - 版本从 v3.6 升级到 v3.7
  - 新增 SmartListTemplate.vue（智能列表模板，内置视图管理）
  - 新增 ColumnSettingsPanel.vue（列设置面板：搜索+拖拽+勾选）
  - git 未提交变更：IconSelect.vue（自定义图标）、MenuManagement.vue（图标集成）
  - 新增 material-system/server/ 独立 Node.js 服务器
  - 新增 stitch-material-list-spec.md / figma-design-spec.md 设计规范文档
  - 新增 sprite_nav.svg 导航图标集
- **文件更新**: `docs/功能开发文档.md`

## 2026-04-20 08:57

- **任务**: 扫描项目文件结构，更新功能开发文档
- **执行结果**: 成功
- **更新内容**:
  - 版本从 v3.4 升级到 v3.5
  - 扫描确认：代码实际状态与上次（v3.4）一致，无新增页面/功能
  - 一级导航样式规范子文档已更新至 v1.6，知识索引同步
  - git 未提交变更（FirstSidebar/SecondSidebar/app.ts/MaterialList）仍存在，保持 🔄 标注
- **文件更新**: `docs/功能开发文档.md`

## 2026-04-16 08:57

- **任务**: 扫描项目文件结构，更新功能开发文档
- **执行结果**: 成功
- **更新内容**:
  - 版本从 v3.0 升级到 v3.1
  - 采购订单前端已接入后端 API（`/api/purchase-orders`）
  - FilterForm.vue 新增 daterange 日期范围筛选类型
  - 新增 CustomNavMenuController、UserPreferenceController 后端记录
  - 后端目录结构完整更新（26个Java文件）
  - 待办清单修正（采购订单接入完成，PurchaseOrderServiceImpl 仍缺失）
- **文件更新**: `docs/功能开发文档.md`

## 2026-04-13 08:57

- **任务**: 扫描项目文件结构，更新功能开发文档
- **执行结果**: 成功
- **更新内容**:
  - 版本从 v2.8 升级到 v2.9
  - 采购中心页面数从 29 增至 31（新增成本扣调额）
  - 采购订单开始后端接入（Controller/Service/Mapper/Entity 已创建）
  - 新增 settings 目录规划
  - 更新待办列表
- **文件更新**: `docs/功能开发文档.md`
