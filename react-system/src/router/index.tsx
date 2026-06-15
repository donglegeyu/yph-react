/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate, useRouteError, type RouteObject } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import { lazy } from 'react'

function RouteErrorBoundary() {
  const error = useRouteError()
  return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 18, color: 'rgba(0,0,0,0.88)', marginBottom: 12 }}>页面出错了</h2>
      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>{String(error)}</p>
    </div>
  )
}

const LoginView = lazy(() => import('@/pages/common/LoginView'))
const HomeView = lazy(() => import('@/pages/home/HomeView'))
const BuildingView = lazy(() => import('@/components/layout/BuildingView'))

const MaterialCreate = lazy(() => import('@/pages/create/MaterialCreate'))
const MaterialDetail = lazy(() => import('@/pages/detail/MaterialDetail'))
const MaterialList = lazy(() => import('@/pages/list/MaterialList'))
const TagListView = lazy(() => import('@/pages/common/TagListView'))
const CategoryListView = lazy(() => import('@/pages/common/CategoryListView'))
const BrandListView = lazy(() => import('@/pages/common/BrandListView'))
const MenuManagement = lazy(() => import('@/pages/common/MenuManagement'))
const ComponentPreview = lazy(() => import('@/pages/common/ComponentPreview'))
const DomainForm = lazy(() => import('@/pages/form/DomainForm'))
const DomainManagement = lazy(() => import('@/pages/common/DomainManagement'))
const UserManagement = lazy(() => import('@/pages/common/UserManagement'))
const DepartmentManagement = lazy(() => import('@/pages/common/DepartmentManagement'))
const RoleManagement = lazy(() => import('@/pages/common/RoleManagement'))
const PermissionQuery = lazy(() => import('@/pages/common/PermissionQuery'))
const JiuHaoHang = lazy(() => import('@/pages/common/JiuHaoHang'))
const ConstructionList = lazy(() => import('@/pages/common/ConstructionList'))
const CraftsmanQuery = lazy(() => import('@/pages/common/CraftsmanQuery'))
const ConstructionApplicationList = lazy(() => import('@/pages/common/ConstructionApplicationList'))
const PurchaseDemandCreate = lazy(() => import('@/pages/purchase/PurchaseDemandCreate'))
const PurchaseDemandDetail = lazy(() => import('@/pages/purchase/PurchaseDemandDetail'))
const PurchaseDemandList = lazy(() => import('@/pages/purchase/PurchaseDemandList'))
const PurchaseOrderCreate = lazy(() => import('@/pages/purchase/PurchaseOrderCreate'))
const PurchaseOrderDetail = lazy(() => import('@/pages/purchase/PurchaseOrderDetail'))
const PurchaseMinOrder = lazy(() => import('@/pages/purchase/PurchaseMinOrder'))
const PurchaseMinAcceptancePeriod = lazy(() => import('@/pages/purchase/PurchaseMinAcceptancePeriod'))
const PurchaseReturnAddress = lazy(() => import('@/pages/purchase/PurchaseReturnAddress'))
const PurchasePrice = lazy(() => import('@/pages/purchase/PurchasePrice'))
const PurchasePriceApply = lazy(() => import('@/pages/purchase/PurchasePriceApply'))
const SalesRebateQuery = lazy(() => import('@/pages/purchase/SalesRebateQuery'))
const SalesRebateApply = lazy(() => import('@/pages/purchase/SalesRebateApply'))
const PurchaseContract = lazy(() => import('@/pages/purchase/PurchaseContract'))
const PurchaseReturn = lazy(() => import('@/pages/purchase/PurchaseReturn'))
const PurchaseReturnReview = lazy(() => import('@/pages/purchase/PurchaseReturnReview'))
const PurchaseReturnAgent = lazy(() => import('@/pages/purchase/PurchaseReturnAgent'))
const PurchaseReturnBK = lazy(() => import('@/pages/purchase/PurchaseReturnBK'))
const QrcodeApply = lazy(() => import('@/pages/purchase/QrcodeApply'))
const StatementManage = lazy(() => import('@/pages/purchase/StatementManage'))
const StatementManageBK = lazy(() => import('@/pages/purchase/StatementManageBK'))
const AutoReconcileConfig = lazy(() => import('@/pages/purchase/AutoReconcileConfig'))
const NonAutoReconcileConfig = lazy(() => import('@/pages/purchase/NonAutoReconcileConfig'))
const InvoiceManage = lazy(() => import('@/pages/purchase/InvoiceManage'))
const InvoiceManageBK = lazy(() => import('@/pages/purchase/InvoiceManageBK'))
const AdvancePayment = lazy(() => import('@/pages/purchase/AdvancePayment'))
const ShopStatement = lazy(() => import('@/pages/purchase/ShopStatement'))
const CostDeductionConfig = lazy(() => import('@/pages/purchase/CostDeductionConfig'))
const CostDeductionAdjust = lazy(() => import('@/pages/purchase/CostDeductionAdjust'))
const SecurityCheckQuery = lazy(() => import('@/pages/common/SecurityCheckQuery'))
const SecurityCheckDetail = lazy(() => import('@/pages/common/SecurityCheckDetail'))
const SalesDashboard = lazy(() => import('@/pages/home/SalesDashboard'))

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginView />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <SalesDashboard /> },
      { path: 'building', element: <BuildingView /> },
      { path: 'materials/create', element: <MaterialCreate /> },
      { path: 'materials/:id', element: <MaterialDetail /> },
      { path: 'materials', element: <MaterialList /> },
      { path: 'construction-library', element: <ConstructionList /> },
      { path: 'craftsman-search', element: <CraftsmanQuery /> },
      { path: 'construction-apply', element: <ConstructionApplicationList /> },
      { path: 'tag-list', element: <TagListView /> },
      { path: 'category-list', element: <CategoryListView /> },
      { path: 'brand-list', element: <BrandListView /> },
      { path: 'menu-management', element: <MenuManagement /> },
      { path: 'component-preview', element: <ComponentPreview /> },
      { path: 'domain-manage/create', element: <DomainForm /> },
      { path: 'domain-manage/:id', element: <DomainForm /> },
      { path: 'domain-manage', element: <DomainManagement /> },
      { path: 'user-management', element: <UserManagement /> },
      { path: 'department-management', element: <DepartmentManagement /> },
      { path: 'role-management', element: <RoleManagement /> },
      { path: 'permission-query', element: <PermissionQuery /> },
      { path: 'dao-hang', element: <JiuHaoHang /> },
      { path: 'purchase-demand/create', element: <PurchaseDemandCreate /> },
      { path: 'purchase-demand/:id', element: <PurchaseDemandDetail /> },
      { path: 'purchase-demand', element: <PurchaseDemandList /> },
      { path: 'purchase-order/create', element: <PurchaseOrderCreate /> },
      { path: 'purchase-order/:id', element: <PurchaseOrderDetail /> },
      { path: 'purchase-min-order', element: <PurchaseMinOrder /> },
      { path: 'purchase-min-acceptance-period', element: <PurchaseMinAcceptancePeriod /> },
      { path: 'purchase-return-address', element: <PurchaseReturnAddress /> },
      { path: 'purchase-price', element: <PurchasePrice /> },
      { path: 'purchase-price/apply', element: <PurchasePriceApply /> },
      { path: 'sales-rebate-query', element: <SalesRebateQuery /> },
      { path: 'sales-rebate/apply', element: <SalesRebateApply /> },
      { path: 'purchase-contract', element: <PurchaseContract /> },
      { path: 'purchase-return', element: <PurchaseReturn /> },
      { path: 'purchase-return/review', element: <PurchaseReturnReview /> },
      { path: 'purchase-return/agent', element: <PurchaseReturnAgent /> },
      { path: 'purchase-return/bk', element: <PurchaseReturnBK /> },
      { path: 'qrcode-apply', element: <QrcodeApply /> },
      { path: 'statement-manage', element: <StatementManage /> },
      { path: 'statement-manage/bk', element: <StatementManageBK /> },
      { path: 'auto-reconcile-config', element: <AutoReconcileConfig /> },
      { path: 'non-auto-reconcile-config', element: <NonAutoReconcileConfig /> },
      { path: 'invoice-manage', element: <InvoiceManage /> },
      { path: 'invoice-manage/bk', element: <InvoiceManageBK /> },
      { path: 'advance-payment', element: <AdvancePayment /> },
      { path: 'shop-statement', element: <ShopStatement /> },
      { path: 'cost-deduction-config', element: <CostDeductionConfig /> },
      { path: 'cost-deduction-adjust', element: <CostDeductionAdjust /> },
      { path: 'security-check-query', element: <SecurityCheckQuery /> },
      { path: 'security-check-query/:id', element: <SecurityCheckDetail /> },
      { path: '*', element: <BuildingView /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
export default router
