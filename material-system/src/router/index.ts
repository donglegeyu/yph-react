import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { registerRoute } from './pathComponentMap'

// 动态路由配置
const DYNAMIC_ROUTES: Record<string, string> = {
  '/materials/create': '@/views/create/MaterialCreate.vue',
  '/materials/:id': '@/views/detail/MaterialDetail.vue',
  '/materials': '@/views/list/MaterialList.vue',
  '/construction-library': '@/views/common/ConstructionList.vue',
  '/construction-apply': '@/views/common/ConstructionApplicationList.vue',
  '/tag-list': '@/views/common/TagListView.vue',
  '/category-list': '@/views/common/CategoryListView.vue',
  '/brand-list': '@/views/common/BrandListView.vue',
  '/menu-management': '@/views/common/MenuManagement.vue',
  '/component-preview': '@/views/common/ComponentPreview.vue',
  '/domain-manage/create': '@/views/form/DomainForm.vue',
  '/domain-manage/:id': '@/views/form/DomainForm.vue',
  '/domain-manage': '@/views/common/DomainManagement.vue',
  '/user-management': '@/views/common/UserManagement.vue',
  '/permission-query': '@/views/common/PermissionQuery.vue',
  '/basic-settings': '@/components/layout/BuildingView.vue',
  '/dao-hang': '@/views/common/JiuHaoHang.vue',
  '/purchase-demand/create': '@/views/purchase/PurchaseDemandCreate.vue',
  '/purchase-demand/:id': '@/views/purchase/PurchaseDemandDetail.vue',
  '/purchase-demand': '@/views/purchase/PurchaseDemandList.vue',
  '/purchase-order': '@/views/purchase/PurchaseOrderList.vue',
  '/purchase-order/create': '@/views/purchase/PurchaseOrderCreate.vue',
  '/purchase-order/:id': '@/views/purchase/PurchaseOrderDetail.vue',
  '/purchase-min-order': '@/views/purchase/PurchaseMinOrder.vue',
  '/purchase-min-acceptance-period': '@/views/purchase/PurchaseMinAcceptancePeriod.vue',
  '/purchase-return-address': '@/views/purchase/PurchaseReturnAddress.vue',
  '/purchase-price': '@/views/purchase/PurchasePrice.vue',
  '/purchase-price/apply': '@/views/purchase/PurchasePriceApply.vue',
  '/sales-rebate-query': '@/views/purchase/SalesRebateQuery.vue',
  '/sales-rebate/apply': '@/views/purchase/SalesRebateApply.vue',
  '/purchase-contract': '@/views/purchase/PurchaseContract.vue',
  '/purchase-return': '@/views/purchase/PurchaseReturn.vue',
  '/purchase-return/review': '@/views/purchase/PurchaseReturnReview.vue',
  '/purchase-return/agent': '@/views/purchase/PurchaseReturnAgent.vue',
  '/purchase-return/bk': '@/views/purchase/PurchaseReturnBK.vue',
  '/qrcode-apply': '@/views/purchase/QrcodeApply.vue',
  '/statement-manage': '@/views/purchase/StatementManage.vue',
  '/statement-manage/bk': '@/views/purchase/StatementManageBK.vue',
  '/auto-reconcile-config': '@/views/purchase/AutoReconcileConfig.vue',
  '/non-auto-reconcile-config': '@/views/purchase/NonAutoReconcileConfig.vue',
  '/invoice-manage': '@/views/purchase/InvoiceManage.vue',
  '/invoice-manage/bk': '@/views/purchase/InvoiceManageBK.vue',
  '/advance-payment': '@/views/purchase/AdvancePayment.vue',
  '/shop-statement': '@/views/purchase/ShopStatement.vue',
  '/cost-deduction-config': '@/views/purchase/CostDeductionConfig.vue',
  '/cost-deduction-adjust': '@/views/purchase/CostDeductionAdjust.vue',
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 登录页
    { path: '/login', name: 'Login', component: () => import('@/views/common/LoginView.vue'), meta: { title: '登录' } },
    // 主布局
    {
      path: '/',
      name: 'default',
      component: MainLayout,
      redirect: '/home',
      children: [
        { path: 'home', name: 'Home', component: () => import('@/components/layout/BuildingView.vue'), meta: { title: '首页' } },
        { path: 'building', name: 'Building', component: () => import('@/views/home/HomeView.vue'), meta: { title: '首页' } },
        { path: ':pathMatch(.*)*', name: 'NotFound', component: () => import('@/components/layout/BuildingView.vue'), meta: { title: '页面开发中' } },
      ],
    },
  ],
})

// 在 router 初始化后立即注册所有动态路由
function registerAllDynamicRoutes() {
  console.log('[registerAllDynamicRoutes] 开始注册...')
  for (const [path, componentPath] of Object.entries(DYNAMIC_ROUTES)) {
    registerRoute(router as any, path, componentPath)
  }
  console.log('[registerAllDynamicRoutes] 注册完成，路由数:', router.getRoutes().length)
}

// 立即执行注册
registerAllDynamicRoutes()

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '材料管理系统'} - 材料管理系统`
  const token = localStorage.getItem('token')
  if (to.path === '/login') {
    if (token) next('/home')
    else next()
    return
  }
  if (!token) {
    next('/login')
    return
  }
  next()
})

export default router
