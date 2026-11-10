/**
 * AI 导航桥
 *
 * 把 company-ui 1.2.45 的 AiActionGuard（动作白名单 + 确认 + 实时权限 + 幂等 + 审计）
 * 与项目自己的 AI 面板接线：
 *
 * - 本组件必须渲染在 AiAssistantProvider 内（本项目的 4 列布局没有使用 AiAssistantDock，
 *   因此直接挂 AiActionGuard，等价于 AiAssistantDock 的 actionGuard 属性）
 * - 内部通过 useAiAction() 获得 run，处理 navigate 动作
 * - 通过 aiNavigationRuntime 的模块级 handler 暴露给 NavigationAiTransport（非 React 环境）调用
 *
 * 本期只实现 navigate；open-record / close-tab 等预留，不在 run 中放行
 * （checkPermission 只对 navigate 返回 true，其余动作一律拒绝）。
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AiActionGuard,
  useAiAction,
  type AiActionParams,
  type AiActionType,
} from '@donglegeyu/company-ui'
import { useAppStore } from '@/store/app'
import {
  getCurrentDomainId,
  isMenuAccessible,
  resolveMenuTarget,
  type MenuCatalogEntry,
} from './menuCatalog'
import { recordAudit, setAiNavigationHandler } from './aiNavigationRuntime'

/** 候选/推荐统一渲染成一行，避免面板里出现大段堆叠 */
function formatEntries(entries: MenuCatalogEntry[]): string {
  return entries
    .map((entry, index) => `${index + 1}. ${entry.label}${entry.parentLabel ? `（${entry.parentLabel}）` : ''}`)
    .join('，')
}

function BridgeInner() {
  const { run } = useAiAction()
  const navigate = useNavigate()
  const navigateToPath = useAppStore((s) => s.navigateToPath)
  const openTab = useAppStore((s) => s.openTab)

  useEffect(() => {
    const handler = async (target: string): Promise<string> => {
      const resolution = await resolveMenuTarget(target)

      if (resolution.status === 'forbidden') {
        return `你没有权限访问「${resolution.entry.label}」，请联系管理员开通该菜单权限。`
      }
      if (resolution.status === 'groupCandidates') {
        return `「${resolution.group.label}」下面有 ${resolution.candidates.length} 个页面：${formatEntries(resolution.candidates)}。请告诉我想打开哪一个。`
      }
      if (resolution.status === 'ambiguous') {
        return `找到多个匹配：${formatEntries(resolution.candidates)}。请回复完整菜单名再试一次。`
      }
      if (resolution.status === 'notFound') {
        const tail = resolution.suggestions.length
          ? `你是不是想找：${formatEntries(resolution.suggestions)}？`
          : '可以换个更完整的菜单名再试一次。'
        return `没有找到「${target}」这个菜单。${tail}`
      }

      const { entry } = resolution
      const result = await run(
        'navigate',
        { menuKey: entry.key, path: entry.path, label: entry.label },
        async () => {
          // 与 SecondSidebar 点击一致：同步侧边栏状态 → 开页签 → 路由跳转
          const hit = navigateToPath(entry.path)
          if (!hit) {
            useAppStore.getState().setActiveKey(entry.key)
          }
          openTab(entry.key, entry.label, entry.path)
          navigate(entry.path)
          return {}
        },
      )

      if (result.ok) {
        return `已为你打开「${entry.label}」${entry.parentLabel ? `（${entry.parentLabel}）` : ''}。`
      }
      switch (result.reason) {
        case 'denied':
          return `当前策略不允许打开「${entry.label}」。`
        case 'forbidden':
          return `你没有权限访问「${entry.label}」，请联系管理员开通该菜单权限。`
        case 'cancelled':
          return `已取消打开「${entry.label}」。`
        default:
          return `打开「${entry.label}」失败${result.message ? `：${result.message}` : '，请稍后重试'}。`
      }
    }

    setAiNavigationHandler(handler)
    return () => setAiNavigationHandler(null)
  }, [run, navigate, navigateToPath, openTab])

  return null
}

/** AI 动作闸门注入点：domain / userId 由宿主提供，权限按当前域的菜单可访问性判断 */
export default function AiNavigationBridge() {
  const userInfo = useAppStore((s) => s.userInfo)
  const domain = getCurrentDomainId()
  const userId = String(userInfo?.id ?? userInfo?.username ?? 'anonymous')

  const checkPermission = (action: AiActionType, params: AiActionParams): boolean => {
    if (action !== 'navigate') return false
    return isMenuAccessible(String(params.menuKey ?? ''), String(params.path ?? ''))
  }

  return (
    <AiActionGuard
      domain={domain}
      userId={userId}
      checkPermission={checkPermission}
      onAudit={recordAudit}
    >
      <BridgeInner />
    </AiActionGuard>
  )
}
