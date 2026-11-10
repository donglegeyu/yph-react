/**
 * AI 导航传输包装
 *
 * 为什么在传输层拦截：
 * company-ui 1.2.45 的 AiStreamEvent 只有 backfill 一种 actionType，
 * 模型无法通过 SSE 下发 navigate 帧，本期也不改后端。因此在用户发出明确导航指令时
 * 本地解析并直接经 AiActionGuard 执行；其余消息原样透传给真实 SSE 网关。
 *
 * 判定范围：导航动词开头（允许 "我要/我想/请帮我/麻烦帮我" 等口语前缀），
 * 剥掉 "页面/页/界面/详情页/一下" 等导航后缀后再进匹配器；同时排除含疑问词的目标
 * （避免 "打开后怎么保存" 这类提问被误判）。
 */
import type { AiTransport } from '@donglegeyu/company-ui'
import { hasAiNavigationHandler, runAiNavigation } from './aiNavigationRuntime'

/**
 * 导航指令正则：前缀段（礼貌词 + 诉求） + 动词 + 目标
 * 前缀用两级可选串联（不是单个），允许：
 * - 礼貌词：请 / 麻烦
 * - 诉求：我要 / 我想 / 我 / 帮我 / 帮忙
 * 动词按长度优先列，目标捕获组 (.+) 后续会再剥导航后缀。
 */
const NAV_INTENT_PATTERN =
  /^(?:(?:请|麻烦)(?:帮我|帮忙)?|(?:帮我|帮忙)|(?:我要|我想|我))?(?:跳转到|跳到|导航到|导航|切换到|切换|前往|直达|打开|进入|去)(?:一下|下)?(.+)$/

/** 导航目标常见后缀（剥掉后再进匹配器） */
const NAV_TARGET_SUFFIX = /(一下|详情页|详情|页面|界面|页)$/

/** 目标名长度上限，超过视为普通提问而非菜单名 */
const MAX_TARGET_LENGTH = 20

/** 含疑问词/从句的目标大概率是提问，不拦截 */
const QUESTION_PATTERN = /(怎么|如何|什么|为什么|是否|能不能|可以|吗|呢|哪个|哪些|在哪|为啥|为何|怎样)/

/** 标点统一清理 */
const PUNCT_PATTERN = /[。！？!?，,、：:“”"'（）()【】《》]/g

/** 解析导航意图，返回清洗后的菜单名候选；非导航指令返回 null */
export function parseNavigationIntent(message: string): string | null {
  const trimmed = message.trim()
  const match = NAV_INTENT_PATTERN.exec(trimmed)
  if (!match) return null
  const rawTarget = match[1]
  if (!rawTarget) return null
  let target = rawTarget.trim().replace(PUNCT_PATTERN, '').trim()
  target = target.replace(NAV_TARGET_SUFFIX, '').trim()
  if (!target) return null
  if (target.length > MAX_TARGET_LENGTH) return null
  if (QUESTION_PATTERN.test(target)) return null
  return target
}

/**
 * 导航优先的传输实现：
 * 命中导航指令 → 本地解析 + AiActionGuard 执行，直接回写可读文本；
 * 其余情况（含未注册导航桥、非导航指令、导航桥异常）原样委托 inner。
 */
export class NavigationAiTransport implements AiTransport {
  private readonly inner: AiTransport

  constructor(inner: AiTransport) {
    this.inner = inner
  }

  send(params: Parameters<AiTransport['send']>[0]): void {
    const target = parseNavigationIntent(params.message)
    if (!target || !hasAiNavigationHandler()) {
      this.inner.send(params)
      return
    }

    void (async () => {
      try {
        const text = await runAiNavigation(target)
        if (text === null) {
          this.inner.send(params)
          return
        }
        params.onEvent({ type: 'delta', text })
        params.onEvent({ type: 'done' })
      } catch {
        // 导航桥异常时回落到模型，避免静默失败
        this.inner.send(params)
      }
    })()
  }

  abort(): void {
    this.inner.abort?.()
  }
}
