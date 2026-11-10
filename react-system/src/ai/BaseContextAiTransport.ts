/**
 * AI 传输包装 · 基础页面上下文注入
 *
 * 在 SSE 透传前合并第一档 base 上下文（extra.base），页面无需注册。
 * 页面级上下文由 capability.getContext() 经引擎采集后传入，此处只做合并，不改页面数据。
 *
 * 跳过 page-generator：该场景后端走补丁分支，不消费 extra，注入只会增加 token。
 */
import type { AiTransport } from '@donglegeyu/company-ui'
import { mergeBaseContext } from './basePageContext'

/** 不注入 base 的场景（后端不消费 extra.base） */
const SKIP_BASE_SCENES = new Set(['page-generator'])

export class BaseContextAiTransport implements AiTransport {
  private readonly inner: AiTransport

  constructor(inner: AiTransport) {
    this.inner = inner
  }

  send(params: Parameters<AiTransport['send']>[0]): void {
    if (SKIP_BASE_SCENES.has(params.scene)) {
      this.inner.send(params)
      return
    }
    this.inner.send({ ...params, context: mergeBaseContext(params.context) })
  }

  abort(): void {
    this.inner.abort?.()
  }
}
