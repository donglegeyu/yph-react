# automation-3: 功能开发文档自动更新

## 执行历史

### 2026-04-23 12:00 执行
- **状态**: 成功
- **版本**: v4.0 → v4.1
- **扫描范围**:
  - `src/components/FilterForm.vue`（🔄 未提交修改）
  - `src/components/SmartListTemplate.vue`（🔄 未提交修改）
  - `src/router/pathComponentMap.ts`（路由条数核实）
- **更新内容**:
  - FilterForm 性能优化：watch modelValue 增加 JSON.stringify 同值跳过 + flush:'post'
  - SmartListTemplate 字段同步精简：删除复杂 watch fields 逻辑（48行），改为 computed 单向驱动
  - 修正路由条数（42→46）
  - 新增 v4.1 版本历史条目
  - 同步到 artifact 目录

### 2026-04-22 12:00 执行
- **状态**: 成功
- **版本**: v3.9 → v4.0
- **扫描范围**:
  - `src/views/common/`（新增 ConstructionApplicationList.vue）
  - `src/components/`（新增 FilterOptionsDrawer.vue）
  - `src/router/index.ts`（新增路由 /construction-apply，共 42 条）
  - `material-system-server/controller/`（新增 ConstructionApplicationController/ConstructionViewController）
  - `material-system-server/entity/service/mapper/`（各新增 2 个施工申请相关文件）
  - `material-system-server/sql/`（新增 construction_application.sql）
- **更新内容**:
  - 通用组件新增 FilterOptionsDrawer.vue
  - 材料中心新增施工申请列表页（路由 /construction-apply）
  - 后端 API 表新增施工申请 + 施工视图两个完整模块
  - 新增「施工申请列表」「FilterOptionsDrawer」「施工视图管理」特性章节
  - 待办清单新增并勾选施工申请相关项
  - 版本历史新增 v4.0 条目
  - 同步到 artifact 目录

- **状态**: 成功
- **扫描范围**:
  - `src/views/` (common, create, detail, list, purchase, home)
  - `src/components/` (layout/ + 4个通用组件)
  - `src/router/` (index.ts, pathComponentMap.ts)
  - `material-system-server/` (controller/entity/service/mapper/sql)
- **更新内容**:
  - 版本 v3.1 → v3.2
  - 新增「材料视图管理」模块（MaterialView 全套后端：Controller/Service/ServiceImpl/Mapper/Entity + material_view.sql）
  - 修正 PurchaseOrderServiceImpl 状态：❌缺失 → ✅已完成
  - 后端 API 表格补充 SQL 列
  - 待办清单勾选 PurchaseOrderServiceImpl 任务
  - 同步到 artifact 目录

### 2026-04-12 执行
- **状态**: 成功
- **扫描范围**:
  - `src/views/` (common, create, detail, list, purchase, settings, home)
  - `src/stores/app.ts`
  - `src/router/` (index.ts, pathComponentMap.ts)
  - `src/components/layout/` (7个组件)
- **更新内容**:
  - 版本 v2.7 → v2.8
  - 新增「布局组件」分类（7个组件）
  - 新增「新增特性」章节（收藏、自定义导航栏、更多菜单、二级菜单、标签页）
  - 补充目录结构说明
  - 同步到 artifact 目录

### 2026-04-10 首次创建
- 自动化任务创建
- 每日 12:00 执行
