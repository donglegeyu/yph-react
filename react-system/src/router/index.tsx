import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import { lazy } from 'react'

// 懒加载页面
const LoginView = lazy(() => import('@/pages/common/LoginView'))
const HomeView = lazy(() => import('@/pages/home/HomeView'))
const BuildingView = lazy(() => import('@/components/layout/BuildingView'))

// 动态路由配置（后续可以从 API 加载）
export const DYNAMIC_ROUTES: Record<string, string> = {
  '/materials/create': '@/pages/create/MaterialCreate',
  '/materials/:id': '@/pages/detail/MaterialDetail',
  '/materials': '@/pages/list/MaterialList',
  '/construction-library': '@/pages/common/ConstructionList',
  '/construction-apply': '@/pages/common/ConstructionApplicationList',
  '/tag-list': '@/pages/common/TagListView',
  '/category-list': '@/pages/common/CategoryListView',
  '/brand-list': '@/pages/common/BrandListView',
  '/menu-management': '@/pages/common/MenuManagement',
  '/component-preview': '@/pages/common/ComponentPreview',
  '/domain-manage/create': '@/pages/form/DomainForm',
  '/domain-manage/:id': '@/pages/form/DomainForm',
  '/domain-manage': '@/pages/common/DomainManagement',
  '/user-management': '@/pages/common/UserManagement',
  '/permission-query': '@/pages/common/PermissionQuery',
  '/dao-hang': '@/pages/common/JiuHaoHang',
  '/purchase-demand/create': '@/pages/purchase/PurchaseDemandCreate',
  '/purchase-demand/:id': '@/pages/purchase/PurchaseDemandDetail',
  '/purchase-demand': '@/pages/purchase/PurchaseDemandList',
  '/purchase-order': '@/pages/purchase/PurchaseOrderList',
  '/purchase-order/create': '@/pages/purchase/PurchaseOrderCreate',
  '/purchase-order/:id': '@/pages/purchase/PurchaseOrderDetail',
  '/purchase-min-order': '@/pages/purchase/PurchaseMinOrder',
  '/purchase-min-acceptance-period': '@/pages/purchase/PurchaseMinAcceptancePeriod',
  '/purchase-return-address': '@/pages/purchase/PurchaseReturnAddress',
  '/purchase-price': '@/pages/purchase/PurchasePrice',
  '/purchase-price/apply': '@/pages/purchase/PurchasePriceApply',
  '/sales-rebate-query': '@/pages/purchase/SalesRebateQuery',
  '/sales-rebate/apply': '@/pages/purchase/SalesRebateApply',
  '/purchase-contract': '@/pages/purchase/PurchaseContract',
  '/purchase-return': '@/pages/purchase/PurchaseReturn',
  '/purchase-return/review': '@/pages/purchase/PurchaseReturnReview',
  '/purchase-return/agent': '@/pages/purchase/PurchaseReturnAgent',
  '/purchase-return/bk': '@/pages/purchase/PurchaseReturnBK',
  '/qrcode-apply': '@/pages/purchase/QrcodeApply',
  '/statement-manage': '@/pages/purchase/StatementManage',
  '/statement-manage/bk': '@/pages/purchase/StatementManageBK',
  '/auto-reconcile-config': '@/pages/purchase/AutoReconcileConfig',
  '/non-auto-reconcile-config': '@/pages/purchase/NonAutoReconcileConfig',
  '/invoice-manage': '@/pages/purchase/InvoiceManage',
  '/invoice-manage/bk': '@/pages/purchase/InvoiceManageBK',
  '/advance-payment': '@/pages/purchase/AdvancePayment',
  '/shop-statement': '@/pages/purchase/ShopStatement',
  '/cost-deduction-config': '@/pages/purchase/CostDeductionConfig',
  '/cost-deduction-adjust': '@/pages/purchase/CostDeductionAdjust',
}

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginView />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: 'home',
        element: <HomeView />,
      },
      {
        path: 'building',
        element: <BuildingView />,
      },
      {
        path: '*',
        element: <BuildingView />,
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
export default router
