/**
 * AI 导航运行时（非组件模块）
 *
 * 存放模块级状态与回调，供 AiNavigationBridge（React）与 NavigationAiTransport（非 React）共享：
 * - 导航处理器注册表（页面卸载时清空）
 * - 临时审计落地：结构化前端回调 + 预留后端上报地址
 */
import type { AiActionAuditEvent } from '@donglegeyu/company-ui'

/** 预留后端审计上报地址：后端本次不改，接口就绪后在此处 flush（当前只在控制台落地） */
export const AI_AUDIT_ENDPOINT = '/api/ai/actions/audit'

/** 临时审计缓冲：保留最近 50 条，便于调试与后续上报 */
const auditBuffer: AiActionAuditEvent[] = []

/** 临时审计：仅前端落地（等后端 POST /api/ai/actions/audit 提供后再改为上报） */
export function recordAudit(event: AiActionAuditEvent): void {
  auditBuffer.push(event)
  if (auditBuffer.length > 50) auditBuffer.shift()
  console.info('[ai-audit]', event)
}

/** 导航处理器：入参为自然语言菜单名，返回可直接回写到面板的文本 */
export type AiNavigationHandler = (target: string) => Promise<string>

let activeHandler: AiNavigationHandler | null = null

export function setAiNavigationHandler(handler: AiNavigationHandler | null): void {
  activeHandler = handler
}

export function hasAiNavigationHandler(): boolean {
  return activeHandler !== null
}

/** 供 transport 调用：未注册 handler 时返回 null，由调用方回落真实模型 */
export async function runAiNavigation(target: string): Promise<string | null> {
  if (!activeHandler) return null
  return activeHandler(target)
}
