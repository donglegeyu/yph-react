/**
 * AI 导航 · 第一档「知道你在哪」基础上下文
 *
 * 布局层统一注入，页面无需注册：应用名、域、登录用户、路由、菜单面包屑、
 * 页面类型启发式、页签。每轮发送时实时采集（无缓存），路由/域切换下一句即生效。
 *
 * 边界：只描述「位置」，不注入任何页面内数据（列表条数、记录字段、筛选项等
 * 留给页面级第二档），也不含手机号/邮箱/token/apiKey 等敏感字段。
 */
import type { AiContext } from '@donglegeyu/company-ui'
import { useAppStore } from '@/store/app'
import { buildAccessibleCatalog, getCurrentDomainId } from './menuCatalog'

export type BasePageType = 'home' | 'list' | 'detail' | 'form' | 'generator' | 'other'

export interface BasePageContext {
  /** 应用名 */
  app: string
  /** 当前域（仅 id，名称不在前端缓存中） */
  domain: { id: string }
  /** 登录用户白名单字段 */
  user: { id?: number; username?: string; nickname?: string; role?: string }
  /** 当前路由与页签 key */
  route: { pathname: string; tabKey?: string }
  /** 菜单面包屑（末项为当前菜单）与菜单 key */
  menu: { breadcrumb: string[]; key?: string }
  /** 页面类型启发式（非注册信息，仅用于提示模型） */
  pageType: BasePageType
  /** 页签信息 */
  tab: { label?: string; count: number }
  /** 当前可用动作（本期仅导航） */
  capabilities: string[]
}

const APP_NAME = '逸品汇中台'

/** 页面类型启发式：按路由形态推断，宁缺毋滥（不确定时归 list/other） */
function inferPageType(pathname: string): BasePageType {
  if (pathname === '/' || pathname === '/home') return 'home'
  if (/\/generator(\/|$)/.test(pathname) || pathname.includes('page-generator')) return 'generator'
  if (/\/detail(\/|$)/.test(pathname)) return 'detail'
  if (/\/(create|edit)(\/|$)/.test(pathname)) return 'form'
  if (pathname.startsWith('/dynamic/detail/')) return 'detail'
  return 'list'
}

/**
 * 按 pathname 取菜单链：复用可访问菜单目录（store 已按权限过滤），零新增请求。
 * 动态详情页无对应菜单时，回退到其列表页菜单（/dynamic/detail/{key}-detail/{id} → /dynamic/{key}）。
 */
function resolveMenuChain(pathname: string): { breadcrumb: string[]; key?: string } {
  const { entries } = buildAccessibleCatalog()
  const byPath = entries.find((entry) => entry.path === pathname)
  if (byPath) {
    return {
      breadcrumb: [byPath.parentLabel, byPath.label].filter((item): item is string => Boolean(item)),
      key: byPath.key,
    }
  }

  if (pathname.startsWith('/dynamic/detail/')) {
    const segments = pathname.split('/').filter(Boolean)
    const detailKey = segments[2]?.replace(/-detail$/, '')
    if (detailKey) {
      const listEntry = entries.find((entry) => entry.path === `/dynamic/${detailKey}`)
      if (listEntry) {
        return {
          breadcrumb: [listEntry.parentLabel, listEntry.label].filter((item): item is string => Boolean(item)),
          key: listEntry.key,
        }
      }
    }
  }

  return { breadcrumb: [] }
}

/** 实时采集基础上下文（每次调用都读最新 store / 路由 / 本地存储） */
export function collectBaseContext(): BasePageContext {
  const { userInfo, tabs, activeTabKey } = useAppStore.getState()
  const pathname = window.location.pathname
  const currentTab = tabs.find((tab) => tab.key === activeTabKey)
  const menuChain = resolveMenuChain(pathname)

  return {
    app: APP_NAME,
    domain: { id: getCurrentDomainId() },
    user: {
      id: userInfo?.id,
      username: userInfo?.username,
      nickname: userInfo?.nickname,
      role: userInfo?.role,
    },
    route: { pathname, tabKey: activeTabKey || undefined },
    menu: {
      breadcrumb: menuChain.breadcrumb.length > 0 ? menuChain.breadcrumb : [currentTab?.label ?? pathname],
      key: menuChain.key,
    },
    pageType: inferPageType(pathname),
    tab: { label: currentTab?.label, count: tabs.length },
    capabilities: ['navigate'],
  }
}

/**
 * 合并基础上下文与页面级上下文：
 * - 顶层 sceneTitle / schema / values 页面级优先（spread ctx 在前）
 * - extra 浅合并，base 固定占用保留键 `extra.base`，页面不得覆盖
 */
export function mergeBaseContext(ctx?: AiContext): AiContext {
  const pageExtra = ctx?.extra ?? {}
  return {
    ...(ctx ?? {}),
    extra: { ...pageExtra, base: collectBaseContext() },
  }
}
