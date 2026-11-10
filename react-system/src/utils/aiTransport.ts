import type { AiContext, AiStreamEvent, AiTransport } from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'

/**
 * SSE 流式传输实现（company-ui AiTransport 契约）：
 * 前端 → POST /api/ai/chat/stream → 后端读取默认模型配置 → 调 OpenAI 兼容网关 → 逐帧转发。
 * 后端出帧结构与 AiStreamEvent 一致（delta/done/error），此处仅做 SSE 帧解析透传。
 *
 * 多轮会话：按页签缓存 conversationId（隔离键取 BaseContextAiTransport 注入的
 * extra.base.route.tabKey），首轮不传，后端生成后经 done 帧回传并缓存，后续轮次
 * 带上以续接历史；页签关闭重开后沿用缓存，相当于保留该页签的对话记忆。
 */
const DEFAULT_CONVERSATION_KEY = 'default'
const conversationIds = new Map<string, string>()

/** 页签隔离键：extra.base.route.tabKey（缺省场景归并 default，如 page-generator） */
function resolveConversationKey(context?: AiContext): string {
  const extra = context?.extra as { base?: { route?: { tabKey?: string } } } | undefined
  return extra?.base?.route?.tabKey || DEFAULT_CONVERSATION_KEY
}

export class SseAiTransport implements AiTransport {
  private controller: AbortController | null = null

  send(params: {
    scene: string
    context?: AiContext
    message: string
    onEvent: (event: AiStreamEvent) => void
  }): void {
    // 新一轮对话开始前中断上一轮未完成的流
    this.abort()
    const controller = new AbortController()
    this.controller = controller
    const { scene, context, message, onEvent } = params
    const conversationKey = resolveConversationKey(context)
    const conversationId = conversationIds.get(conversationKey)
    // done 帧携带后端生成的 conversationId，缓存供下一轮续接（AIStreamEvent 契约外的后端扩展字段）
    const handleEvent: typeof onEvent = (event) => {
      if (event.type === 'done') {
        const doneId = (event as AiStreamEvent & { conversationId?: string }).conversationId
        if (doneId) conversationIds.set(conversationKey, doneId)
      }
      onEvent(event)
    }

    void (async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(API_ENDPOINTS.AI_CHAT_STREAM, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ scene, context, message, conversationId }),
          signal: controller.signal,
        })
        if (!res.ok || !res.body) {
          onEvent({ type: 'error', code: `HTTP_${res.status}`, message: `AI 服务响应异常（${res.status}）` })
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          // SSE 事件以空行分隔，最后一段可能是未完整帧，留在缓冲区
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''
          for (const part of parts) {
            if (dispatchFrame(part, handleEvent)) return
          }
        }
        // 流结束仍未收到 done（网关异常断开），补帧让会话闭合
        onEvent({ type: 'done' })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        onEvent({ type: 'error', code: 'NETWORK', message: 'AI 服务连接失败，请稍后重试' })
      } finally {
        if (this.controller === controller) this.controller = null
      }
    })()
  }

  abort(): void {
    this.controller?.abort()
    this.controller = null
  }
}

/** 解析单个 SSE 事件块（data: {...}），返回是否应终止流（done/error 后终止） */
function dispatchFrame(chunk: string, onEvent: (event: AiStreamEvent) => void): boolean {
  for (const line of chunk.split('\n')) {
    if (!line.startsWith('data:')) continue
    const payload = line.slice(5).trim()
    if (!payload) continue
    try {
      const frame = JSON.parse(payload) as AiStreamEvent
      onEvent(frame)
      if (frame.type === 'done' || frame.type === 'error') return true
    } catch {
      // 单帧损坏跳过，不中断整条流
    }
  }
  return false
}
