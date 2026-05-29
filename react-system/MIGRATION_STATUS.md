# Vue → React 迁移进展文档

> 生成时间：2026-05-29
> 项目：WorkBuddy NRP 物料系统
> 迁移方向：Vue 3 + Ant Design Vue → React + company-ui

---

## 🌐 开发环境地址

| 版本 | 访问地址 | 说明 |
|------|---------|------|
| Vue 版本 | http://localhost:3010 | 原始版本，用于功能对比和参考 |
| React 版本 | http://localhost:3008 | 迁移目标版本，当前开发中 |

---

## 📊 总体进度

| 指标 | 数量 | 占比 |
|------|------|------|
| Vue 源页面总数 | 46 个 | 100% |
| React 页面总数 | 46 个 | 100% |
| 已完成迁移 | 44 个 | 95.7% |
| 含"建设中"占位符 | 2 个 | 4.3% |
| 完全未开始 | 0 个 | 0% |

---

## ✅ 已完成迁移（44 个）

### common 模块（12 个）

| # | 页面名称 | React 文件 | Vue 源文件 | 状态 |
|---|---------|-----------|-----------|------|
| 1 | 登录页 | [LoginView.tsx](src/pages/common/LoginView.tsx) | [LoginView.vue](../material-system/src/views/common/LoginView.vue) | ✅ 完成 |
| 2 | 首页 | [HomeView.tsx](src/pages/home/HomeView.tsx) | [HomeView.vue](../material-system/src/views/home/HomeView.vue) | ✅ 完成 |
| 3 | 菜单管理 | [MenuManagement.tsx](src/pages/common/MenuManagement.tsx) | [MenuManagement.vue](../material-system/src/views/common/MenuManagement.vue) | ✅ 完成 |
| 4 | 用户管理 | [UserManagement.tsx](src/pages/common/UserManagement.tsx) | [UserManagement.vue](../material-system/src/views/common/UserManagement.vue) | ✅ 完成 |
| 5 | 权限查询 | [PermissionQuery.tsx](src/pages/common/PermissionQuery.tsx) | [PermissionQuery.vue](../material-system/src/views/common/PermissionQuery.vue) | ✅ 完成 |
| 6 | 域管理 | [DomainManagement.tsx](src/pages/common/DomainManagement.tsx) | [DomainManagement.vue](../material-system/src/views/common/DomainManagement.vue) | ✅ 完成 |
| 7 | 域表单 | [DomainForm.tsx](src/pages/form/DomainForm.tsx) | [DomainForm.vue](../material-system/src/views/form/DomainForm.vue) | ✅ 完成 |
| 8 | 标签列表 | [TagListView.tsx](src/pages/common/TagListView.tsx) | [TagListView.vue](../material-system/src/views/common/TagListView.vue) | ✅ 完成 |
| 9 | 品牌列表 | [BrandListView.tsx](src/pages/common/BrandListView.tsx) | [BrandListView.vue](../material-system/src/views/common/BrandListView.vue) | ✅ 完成 |
| 10 | 分类列表 | [CategoryListView.tsx](src/pages/common/CategoryListView.tsx) | [CategoryListView.vue](../material-system/src/views/common/CategoryListView.vue) | ✅ 完成 |
| 11 | 施工列表 | [ConstructionList.tsx](src/pages/common/ConstructionList.tsx) | [ConstructionList.vue](../material-system/src/views/common/ConstructionList.vue) | ✅ 完成 |
| 12 | 施工申请列表 | [ConstructionApplicationList.tsx](src/pages/common/ConstructionApplicationList.tsx) | [ConstructionApplicationList.vue](../material-system/src/views/common/ConstructionApplicationList.vue) | ✅ 完成 |
| 13 | 组件预览 | [ComponentPreview.tsx](src/pages/common/ComponentPreview.tsx) | [ComponentPreview.vue](../material-system/src/views/common/ComponentPreview.vue) | ✅ 完成 |
| 14 | 九号行 | [JiuHaoHang.tsx](src/pages/common/JiuHaoHang.tsx) | [JiuHaoHang.vue](../material-system/src/views/common/JiuHaoHang.vue) | ✅ 完成 |

### list 模块（1 个）

| # | 页面名称 | React 文件 | Vue 源文件 | 状态 |
|---|---------|-----------|-----------|------|
| 1 | 物料列表 | [MaterialList.tsx](src/pages/list/MaterialList.tsx) | [MaterialList.vue](../material-system/src/views/list/MaterialList.vue) | ⚠️ 主体完成，批量导入待实现 |

### create/detail 模块（2 个）

| # | 页面名称 | React 文件 | Vue 源文件 | 状态 |
|---|---------|-----------|-----------|------|
| 1 | 物料创建 | [MaterialCreate.tsx](src/pages/create/MaterialCreate.tsx) | [MaterialCreate.vue](../material-system/src/views/create/MaterialCreate.vue) | ✅ 完成 |
| 2 | 物料详情 | [MaterialDetail.tsx](src/pages/detail/MaterialDetail.tsx) | [MaterialDetail.vue](../material-system/src/views/detail/MaterialDetail.vue) | ✅ 完成 |

### purchase 模块（29 个）

| # | 页面名称 | React 文件 | Vue 源文件 | 状态 |
|---|---------|-----------|-----------|------|
| 1 | 采购需求列表 | [PurchaseDemandList.tsx](src/pages/purchase/PurchaseDemandList.tsx) | [PurchaseDemandList.vue](../material-system/src/views/purchase/PurchaseDemandList.vue) | ✅ 完成 |
| 2 | 采购需求创建 | [PurchaseDemandCreate.tsx](src/pages/purchase/PurchaseDemandCreate.tsx) | [PurchaseDemandCreate.vue](../material-system/src/views/purchase/PurchaseDemandCreate.vue) | ✅ 完成 |
| 3 | 采购需求详情 | [PurchaseDemandDetail.tsx](src/pages/purchase/PurchaseDemandDetail.tsx) | [PurchaseDemandDetail.vue](../material-system/src/views/purchase/PurchaseDemandDetail.vue) | ✅ 完成 |
| 4 | 采购订单列表 | [PurchaseOrderList.tsx](src/pages/purchase/PurchaseOrderList.tsx) | [PurchaseOrderList.vue](../material-system/src/views/purchase/PurchaseOrderList.vue) | ⚠️ 主体完成，批量导入/导出/设置待实现 |
| 5 | 采购订单创建 | [PurchaseOrderCreate.tsx](src/pages/purchase/PurchaseOrderCreate.tsx) | [PurchaseOrderCreate.vue](../material-system/src/views/purchase/PurchaseOrderCreate.vue) | ✅ 完成 |
| 6 | 采购订单详情 | [PurchaseOrderDetail.tsx](src/pages/purchase/PurchaseOrderDetail.tsx) | [PurchaseOrderDetail.vue](../material-system/src/views/purchase/PurchaseOrderDetail.vue) | ✅ 完成 |
| 7 | 最小采购量 | [PurchaseMinOrder.tsx](src/pages/purchase/PurchaseMinOrder.tsx) | [PurchaseMinOrder.vue](../material-system/src/views/purchase/PurchaseMinOrder.vue) | ✅ 完成 |
| 8 | 最小验收期 | [PurchaseMinAcceptancePeriod.tsx](src/pages/purchase/PurchaseMinAcceptancePeriod.tsx) | [PurchaseMinAcceptancePeriod.vue](../material-system/src/views/purchase/PurchaseMinAcceptancePeriod.vue) | ✅ 完成 |
| 9 | 退货地址 | [PurchaseReturnAddress.tsx](src/pages/purchase/PurchaseReturnAddress.tsx) | [PurchaseReturnAddress.vue](../material-system/src/views/purchase/PurchaseReturnAddress.vue) | ✅ 完成 |
| 10 | 采购价管理 | [PurchasePrice.tsx](src/pages/purchase/PurchasePrice.tsx) | [PurchasePrice.vue](../material-system/src/views/purchase/PurchasePrice.vue) | ✅ 完成 |
| 11 | 采购价申请 | [PurchasePriceApply.tsx](src/pages/purchase/PurchasePriceApply.tsx) | [PurchasePriceApply.vue](../material-system/src/views/purchase/PurchasePriceApply.vue) | ✅ 完成 |
| 12 | 销售返利查询 | [SalesRebateQuery.tsx](src/pages/purchase/SalesRebateQuery.tsx) | [SalesRebateQuery.vue](../material-system/src/views/purchase/SalesRebateQuery.vue) | ✅ 完成 |
| 13 | 销售返利申请 | [SalesRebateApply.tsx](src/pages/purchase/SalesRebateApply.tsx) | [SalesRebateApply.vue](../material-system/src/views/purchase/SalesRebateApply.vue) | ✅ 完成 |
| 14 | 采购合同 | [PurchaseContract.tsx](src/pages/purchase/PurchaseContract.tsx) | [PurchaseContract.vue](../material-system/src/views/purchase/PurchaseContract.vue) | ✅ 完成 |
| 15 | 采购退货 | [PurchaseReturn.tsx](src/pages/purchase/PurchaseReturn.tsx) | [PurchaseReturn.vue](../material-system/src/views/purchase/PurchaseReturn.vue) | ✅ 完成 |
| 16 | 自动对账配置 | [AutoReconcileConfig.tsx](src/pages/purchase/AutoReconcileConfig.tsx) | [AutoReconcileConfig.vue](../material-system/src/views/purchase/AutoReconcileConfig.vue) | ✅ 完成 |
| 17 | 非自动对账配置 | [NonAutoReconcileConfig.tsx](src/pages/purchase/NonAutoReconcileConfig.tsx) | [NonAutoReconcileConfig.vue](../material-system/src/views/purchase/NonAutoReconcileConfig.vue) | ✅ 完成 |
| 18 | 发票管理 | [InvoiceManage.tsx](src/pages/purchase/InvoiceManage.tsx) | [InvoiceManage.vue](../material-system/src/views/purchase/InvoiceManage.vue) | ✅ 完成 |
| 19 | 发票管理(BK) | [InvoiceManageBK.tsx](src/pages/purchase/InvoiceManageBK.tsx) | [InvoiceManageBK.vue](../material-system/src/views/purchase/InvoiceManageBK.vue) | ✅ 完成 |
| 20 | 预付款 | [AdvancePayment.tsx](src/pages/purchase/AdvancePayment.tsx) | [AdvancePayment.vue](../material-system/src/views/purchase/AdvancePayment.vue) | ✅ 完成 |
| 21 | 店铺结算 | [ShopStatement.tsx](src/pages/purchase/ShopStatement.tsx) | [ShopStatement.vue](../material-system/src/views/purchase/ShopStatement.vue) | ✅ 完成 |
| 22 | 扣费配置 | [CostDeductionConfig.tsx](src/pages/purchase/CostDeductionConfig.tsx) | [CostDeductionConfig.vue](../material-system/src/views/purchase/CostDeductionConfig.vue) | ✅ 完成 |
| 23 | 扣费调整 | [CostDeductionAdjust.tsx](src/pages/purchase/CostDeductionAdjust.tsx) | [CostDeductionAdjust.vue](../material-system/src/views/purchase/CostDeductionAdjust.vue) | ✅ 完成 |
| 24 | 采购退货审核 | [PurchaseReturnReview.tsx](src/pages/purchase/PurchaseReturnReview.tsx) | [PurchaseReturnReview.vue](../material-system/src/views/purchase/PurchaseReturnReview.vue) | ✅ 完成 |
| 25 | 采购退货(BK) | [PurchaseReturnBK.tsx](src/pages/purchase/PurchaseReturnBK.tsx) | [PurchaseReturnBK.vue](../material-system/src/views/purchase/PurchaseReturnBK.vue) | ✅ 完成 |
| 26 | 采购退货代办 | [PurchaseReturnAgent.tsx](src/pages/purchase/PurchaseReturnAgent.tsx) | [PurchaseReturnAgent.vue](../material-system/src/views/purchase/PurchaseReturnAgent.vue) | ✅ 完成 |
| 27 | 二维码申请 | [QrcodeApply.tsx](src/pages/purchase/QrcodeApply.tsx) | [QrcodeApply.vue](../material-system/src/views/purchase/QrcodeApply.vue) | ✅ 完成 |
| 28 | 结算管理 | [StatementManage.tsx](src/pages/purchase/StatementManage.tsx) | [StatementManage.vue](../material-system/src/views/purchase/StatementManage.vue) | ✅ 完成 |
| 29 | 结算管理(BK) | [StatementManageBK.tsx](src/pages/purchase/StatementManageBK.tsx) | [StatementManageBK.vue](../material-system/src/views/purchase/StatementManageBK.vue) | ✅ 完成 |

---

## ⚠️ 建设中页面详情

### 1. MaterialList.tsx - 物料列表

- **位置**：[src/pages/list/MaterialList.tsx](src/pages/list/MaterialList.tsx)
- **未完成内容**：
  - 批量导入功能（第 126 行：`CompanyMessage.info('批量导入功能开发中')`）
- **Vue 对应功能**：[MaterialList.vue](../material-system/src/views/list/MaterialList.vue) 中包含导入弹窗和 Excel 解析逻辑

### 2. PurchaseOrderList.tsx - 采购订单列表

- **位置**：[src/pages/purchase/PurchaseOrderList.tsx](src/pages/purchase/PurchaseOrderList.tsx)
- **未完成内容**：
  - 批量导出功能（第 129 行，disabled）
  - 批量导入功能（第 130 行，disabled）
  - 设置功能（第 135 行，disabled）
- **Vue 对应功能**：[PurchaseOrderList.vue](../material-system/src/views/purchase/PurchaseOrderList.vue) 中包含完整的批量操作和设置面板

---

## 🔄 迁移模式说明

### 已完成页面的共同特征

所有已完成迁移的页面均实现了以下功能：

1. **列表页标准功能**
   - 筛选表单（FilterForm）
   - 分页表格
   - 新增/编辑/删除操作
   - 批量操作（启用/禁用/删除）
   - 列设置（本地存储持久化）

2. **表单页标准功能**
   - 表单验证
   - 提交/取消操作
   - 数据回显

3. **组件库替换映射**
   - `a-button` → `CompanyButton`
   - `a-table` → `CompanyTable`
   - `a-form` → `CompanyForm`
   - `a-input` → `CompanyInput`
   - `a-select` → `CompanySelect`
   - `a-modal` → `CompanyModal`
   - `a-drawer` → `CompanyDrawer`
   - `a-message` → `CompanyMessage`

---

## 📝 待办事项

- [ ] MaterialList.tsx - 实现批量导入功能
- [ ] PurchaseOrderList.tsx - 实现批量导出功能
- [ ] PurchaseOrderList.tsx - 实现批量导入功能
- [ ] PurchaseOrderList.tsx - 实现设置功能

---

## 🏗️ 技术栈

| 层级 | Vue 版本 | React 版本 |
|------|---------|-----------|
| 框架 | Vue 3 | React 18 |
| 语言 | TypeScript | TypeScript |
| 构建工具 | Vite | Vite |
| UI 组件库 | Ant Design Vue | company-ui (基于 Ant Design) |
| 状态管理 | Pinia | Zustand |
| 路由 | Vue Router | React Router |
| HTTP 客户端 | Axios | Axios |

---

## 📁 目录结构对比

```
material-system/src/views/          react-system/src/pages/
├── common/                         ├── common/
│   ├── LoginView.vue               │   ├── LoginView.tsx
│   ├── HomeView.vue                │   ├── MenuManagement.tsx
│   ├── MenuManagement.vue          │   ├── UserManagement.tsx
│   ├── UserManagement.vue          │   ├── ...
│   └── ...                         ├── home/
├── home/                           │   └── HomeView.tsx
│   └── HomeView.vue                ├── list/
├── list/                           │   └── MaterialList.tsx
│   └── MaterialList.vue            ├── create/
├── create/                         │   └── MaterialCreate.tsx
│   └── MaterialCreate.vue          ├── detail/
├── detail/                         │   └── MaterialDetail.tsx
│   └── MaterialDetail.vue          ├── form/
├── form/                           │   └── DomainForm.tsx
│   └── DomainForm.vue              └── purchase/
└── purchase/                           └── ... (29 个文件)
    └── ... (29 个文件)
```

---

*本文档由自动化扫描生成，最后更新：2026-05-29*
