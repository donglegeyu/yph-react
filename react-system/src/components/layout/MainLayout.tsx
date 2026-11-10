import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/store/app'
import { AiAssistantProvider } from '@donglegeyu/company-ui'
import { SseAiTransport } from '@/utils/aiTransport'
import {
  resolvePageCapabilityKey,
  usePageCapability,
} from '@/ai/pageCapabilityRegistry'
import AiNavigationBridge from '@/ai/AiNavigationBridge'
import { NavigationAiTransport } from '@/ai/NavigationAiTransport'
import { BaseContextAiTransport } from '@/ai/BaseContextAiTransport'
import AiAssistantAside from './AiAssistantAside'
import FirstSidebar from './FirstSidebar'
import SecondSidebar from './SecondSidebar'
import TabBar from './TabBar'

export default function MainLayout() {
  const fetchMenus = useAppStore((s) => s.fetchMenus)
  const loadSidebarPreference = useAppStore((s) => s.loadSidebarPreference)
  const tabs = useAppStore((s) => s.tabs)
  const activeTabKey = useAppStore((s) => s.activeTabKey)
  const location = useLocation()

  useEffect(() => {
    fetchMenus({ resetActive: false })
    loadSidebarPreference()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // AI 助手：按当前页签查找页面注册的能力契约（未注册 = undefined，降级为通用问答）
  const capabilityKey = resolvePageCapabilityKey(activeTabKey, location.pathname)
  const pageCapability = usePageCapability(capabilityKey)
  // 引用页签复用当前活动页签；直接 URL 进入且无页签时，用 fallback key 保证抽屉仍能拿到能力
  const providerTabKey = pageCapability ? capabilityKey : activeTabKey

  // AI 助手：@ 引用页签数据源（TabItem 的 key/label 与 AiReferenceTab 契约一致）
  const aiTabs = useMemo(() => {
    const list: { key: string; label: string; capability?: typeof pageCapability }[] = tabs.map(
      (t) => ({
        key: t.key,
        label: t.label,
        capability: t.key === capabilityKey ? pageCapability : undefined,
      }),
    )
    // 无活动页签（fallback 到 pathname）时补一条当前页面，避免引用为空导致能力失效
    if (pageCapability && !list.some((t) => t.key === capabilityKey)) {
      list.push({ key: capabilityKey, label: '当前页面', capability: pageCapability })
    }
    return list
  }, [tabs, capabilityKey, pageCapability])
  // AI 助手：存活页签 key 列表（列表外的会话自动回收，防泄漏）
  const aiTabKeys = useMemo(() => aiTabs.map((t) => t.key), [aiTabs])
  // AI 助手传输链：导航指令最外层本地拦截 → 其余消息注入基础页面上下文 → 真实网关 SSE
  const aiTransport = useMemo(
    () => new NavigationAiTransport(new BaseContextAiTransport(new SseAiTransport())),
    [],
  )

  return (
    <AiAssistantProvider
      activeTabKey={providerTabKey}
      tabKeys={aiTabKeys}
      tabs={aiTabs}
      capability={pageCapability}
      transport={aiTransport}
      // 面板开合只由 store（用户操作）控制：导航 = 打开页签 + 切页签，不能因此自动收起
      autoCollapseOnTabChange={false}
    >
      {/* AI 动作闸门：本期只放行 navigate，其余动作由 checkPermission 拒绝 */}
      <AiNavigationBridge />
      {/* 4 列布局：一级导航 + 二级导航 + 主区自适应 + AI 面板列（根级全高，关闭态零占位） */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          background: '#F5F5F5',
        }}
      >
        <FirstSidebar />
        <SecondSidebar />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#F5F5F5',
            minWidth: 0,
          }}
        >
          <TabBar />
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <Outlet />
          </div>
        </div>
        <AiAssistantAside />
      </div>
    </AiAssistantProvider>
  )
}
