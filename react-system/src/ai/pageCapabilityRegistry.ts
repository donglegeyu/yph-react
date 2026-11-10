/**
 * 页面 AI 能力注册桥（P2 最小闭环）
 *
 * 背景：company-ui 的 AiAssistantProvider 只接收「当前活动页签」的 capability，
 * 但页面组件无法直接拿到 Provider 实例。这里用一个模块级 Map 做中转：
 * 页面挂载时按 tabKey 注册自己的 AiPageCapability，布局壳按当前页签查找并传给 Provider。
 *
 * tabKey 取舍：优先使用 store.activeTabKey（与 TabBar 的页签 key 一致）；
 * 若当前没有活动页签（例如直接输入 URL 进入 /page-generator/create），退回当前 pathname。
 * 两侧（MainLayout 与页面组件）都调用 resolvePageCapabilityKey，保证 key 一致。
 */
import { useSyncExternalStore } from 'react'
import type { AiPageCapability } from '@donglegeyu/company-ui'

const registry = new Map<string, AiPageCapability>()
const listeners = new Set<() => void>()
let version = 0

function emit(): void {
  version += 1
  listeners.forEach((listener) => listener())
}

/** 注册页面能力；返回注销函数（页面卸载时调用） */
export function registerPageCapability(
  tabKey: string,
  capability: AiPageCapability,
): () => void {
  if (!tabKey) return () => {}
  registry.set(tabKey, capability)
  emit()
  return () => {
    // 只注销自己注册的那份，避免覆盖后来者的注册
    if (registry.get(tabKey) === capability) {
      registry.delete(tabKey)
      emit()
    }
  }
}

export function getPageCapability(tabKey: string): AiPageCapability | undefined {
  return registry.get(tabKey)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getVersion(): number {
  return version
}

/** 布局壳用：订阅注册表变化并返回当前页签的能力（注册晚于首帧也能生效） */
export function usePageCapability(tabKey: string): AiPageCapability | undefined {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  return getPageCapability(tabKey)
}

/** 统一 key 规则：活动页签 key 优先，缺省退回路由 path */
export function resolvePageCapabilityKey(
  activeTabKey: string | undefined,
  pathname: string,
): string {
  return activeTabKey || pathname || ''
}
