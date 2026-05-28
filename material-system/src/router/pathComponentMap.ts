/**
 * 路由路径到组件的映射
 * 用于动态路由加载
 */

import type { Component } from 'vue'

// 使用 import.meta.glob 预加载所有可能用到的 Vue 组件
const componentModules = import.meta.glob<{ default: Component }>(
  [
    '/src/views/**/*.vue',
    '/src/components/layout/**/*.vue',
  ],
  { eager: false }
)

/**
 * 将 @/ 别名路径转换为 import.meta.glob 可匹配的路径
 */
function resolveComponentPath(aliasPath: string): string | undefined {
  // @/ → /src/
  const srcPath = aliasPath.replace('@/', '/src/')
  // 查找匹配的模块
  const matchedKey = Object.keys(componentModules).find(
    key => key === srcPath || key.endsWith(srcPath)
  )
  return matchedKey
}

export function getComponentPath(path: string): string | undefined {
  const map: Record<string, string> = {
    '/login': '@/views/common/LoginView.vue',
    '/home': '@/components/layout/BuildingView.vue',
    '/building': '@/views/home/HomeView.vue',
    '/materials': '@/views/list/MaterialList.vue',
    '/materials/create': '@/views/create/MaterialCreate.vue',
    '/materials/:id': '@/views/detail/MaterialDetail.vue',
    '/construction-library': '@/views/common/ConstructionList.vue',
    '/construction-apply': '@/views/common/ConstructionApplicationList.vue',
    '/tag-list': '@/views/common/TagListView.vue',
    '/category-list': '@/views/common/CategoryListView.vue',
    '/brand-list': '@/views/common/BrandListView.vue',
    '/menu-management': '@/views/common/MenuManagement.vue',
    '/domain-manage': '@/views/common/DomainManagement.vue',
    '/domain-manage/create': '@/views/form/DomainForm.vue',
    '/domain-manage/:id': '@/views/form/DomainForm.vue',
    '/user-management': '@/views/common/UserManagement.vue',
    '/permission-query': '@/views/common/PermissionQuery.vue',
    '/basic-settings': '@/components/layout/BuildingView.vue',
    '/component-preview': '@/views/common/ComponentPreview.vue',
    '/dao-hang': '@/views/common/JiuHaoHang.vue',
    '/purchase-demand': '@/views/purchase/PurchaseDemandList.vue',
    '/purchase-demand/create': '@/views/purchase/PurchaseDemandCreate.vue',
    '/purchase-demand/:id': '@/views/purchase/PurchaseDemandDetail.vue',
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

  if (map[path]) return map[path]
  for (const pattern of Object.keys(map)) {
    if (pattern.includes(':')) {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$')
      if (regex.test(path)) return map[pattern]
    }
  }
  return undefined
}

export function registerRoute(router: { hasRoute: (name: string) => boolean; addRoute: (parent: string, route: object) => void }, path: string, componentPath: string) {
  const routeName = `dynamic_${path.replace(/\//g, '_')}`
  if (router.hasRoute(routeName)) return

  const resolvedPath = resolveComponentPath(componentPath)

  const loadComponent = () => {
    if (resolvedPath && componentModules[resolvedPath]) {
      return componentModules[resolvedPath]().then(m => m.default)
    }
    console.warn(`[registerRoute] 组件未找到: ${componentPath}，使用 BuildingView 兜底`)
    return import('@/components/layout/BuildingView.vue').then(m => m.default)
  }

  router.addRoute('default', {
    path,
    name: routeName,
    component: loadComponent,
    meta: { title: '动态页面', isDynamic: true },
  })
}
