import {
  Component,
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ErrorInfo,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { ConfigProvider, theme } from 'antd'
import {
  CompanyAiAssistant,
  companyTheme,
  useAiAssistantContext,
} from '@donglegeyu/company-ui'
import { useAppStore } from '@/store/app'
import './AiAssistantAside.scss'

/** AI 面板最小宽度（对齐组件库设计稿默认宽 363） */
const MIN_AI_ASIDE_WIDTH = 363
/** 拖拽加宽时主区保留的最小可用宽度：max = 容器宽 − 侧边栏宽 − 该值 */
const MIN_MAIN_WIDTH = 800
/** 面板拖拽宽度的 localStorage 持久化 key */
const AI_ASIDE_WIDTH_STORAGE_KEY = 'app:aiAsideWidth'

/** 面板独立错误边界：助手崩溃只降级面板列，主区不受影响 */
class AiPanelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || '未知错误' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AiAssistantAside Error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ai-assistant-aside__error">
          <div className="ai-assistant-aside__error-title">助手暂时不可用</div>
          <div className="ai-assistant-aside__error-message">{this.state.message}</div>
        </div>
      )
    }
    return this.props.children
  }
}

/** 面板列主体：接线 AiAssistantContext → CompanyAiAssistant（对齐 AdminLayoutTemplate 内部实现） */
const AiAsideBody = memo(function AiAsideBody() {
  const { pinned, togglePin, session, hasActions, canRollback, send, confirmSuggestion, rollback, validate, reference, setReference, tabs } =
    useAiAssistantContext()
  const setAiPanelOpen = useAppStore((s) => s.setAiPanelOpen)
  const { token } = theme.useToken()

  return (
    <div
      className="ai-assistant-aside__body"
      style={
        {
          '--ai-aside-bg': token.colorBgContainer,
          '--ai-aside-text': token.colorTextSecondary,
          '--ai-aside-resize-color': token.colorTextQuaternary,
        } as CSSProperties
      }
    >
      <AiPanelErrorBoundary>
        <CompanyAiAssistant
          messages={session.messages}
          streaming={session.streaming}
          pinned={pinned}
          showActions={hasActions}
          canRollback={canRollback}
          reference={reference}
          referenceTabs={tabs}
          onReferenceChange={setReference}
          onSend={send}
          onPinToggle={togglePin}
          onClose={() => setAiPanelOpen(false)}
          onBackfill={confirmSuggestion}
          onRollback={rollback}
          onValidate={validate}
        />
      </AiPanelErrorBoundary>
    </div>
  )
})

/** 计算面板宽度上限：容器宽 − 两级侧边栏宽 − 主区最小可用宽（不足时兜底为最小宽，防 clamp 区间倒挂） */
function computeAiAsideMaxWidth(aside: HTMLElement) {
  const container = aside.parentElement
  if (!container) return MIN_AI_ASIDE_WIDTH
  const first = container.querySelector<HTMLElement>(':scope > .first-sidebar')
  const second = container.querySelector<HTMLElement>(':scope > .second-sidebar')
  const raw =
    container.clientWidth -
    (first?.offsetWidth ?? 0) -
    (second?.offsetWidth ?? 0) -
    MIN_MAIN_WIDTH
  return Math.max(raw, MIN_AI_ASIDE_WIDTH)
}

/** 读取持久化的面板拖拽宽度（非法值/存储不可用时返回 null） */
function readSavedAiAsideWidth(): number | null {
  try {
    const saved = Number(localStorage.getItem(AI_ASIDE_WIDTH_STORAGE_KEY))
    return Number.isFinite(saved) && saved >= MIN_AI_ASIDE_WIDTH ? saved : null
  } catch {
    return null
  }
}

/** 持久化面板拖拽宽度（隐私模式等存储不可用时静默忽略） */
function saveAiAsideWidth(width: number) {
  try {
    localStorage.setItem(AI_ASIDE_WIDTH_STORAGE_KEY, String(Math.round(width)))
  } catch {
    // ignore
  }
}

/**
 * AI 智能助手面板列：与主区（页签栏 + 内容区）并列的根级全高独立列，对齐设计稿 4 列布局
 * （一级导航 + 二级导航 + 主区自适应 + AI 面板列，面板列从页签栏顶部通到底）。
 * 必须渲染在 AiAssistantProvider 包裹的 tree 内部才能消费 context。
 * - 关闭态渲染 null（零占位，主区独占宽度）
 * - 展开态注入 companyTheme（与库内其他组件一致，不依赖业务侧全局 Provider）
 * - 左缘分隔条支持拖拽调宽：最小 363，上限 = 容器宽 − 侧边栏宽 − 主区最小可用宽（800），
 *   拖拽结果记忆到 localStorage，重新打开/刷新后保持
 */
export default function AiAssistantAside() {
  // 面板开合的唯一真相源是 store（与页签/路由解耦），Provider 内部 open 仅作镜像
  const aiPanelOpen = useAppStore((s) => s.aiPanelOpen)
  const { open: contextOpen, setOpen } = useAiAssistantContext()
  const [width, setWidth] = useState<number>(
    () => readSavedAiAsideWidth() ?? MIN_AI_ASIDE_WIDTH
  )
  const [dragging, setDragging] = useState(false)
  const asideRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ startX: number; startWidth: number; maxWidth: number } | null>(
    null
  )
  const latestWidthRef = useRef(width)

  // store → Provider 单向镜像：保证欢迎语生成、引用初始化等组件库内部逻辑照常工作。
  // 即使 Provider 内部 open 被意外置 false，也会在绘制前被拉回，面板不闪烁
  useLayoutEffect(() => {
    if (contextOpen !== aiPanelOpen) setOpen(aiPanelOpen)
  }, [contextOpen, aiPanelOpen, setOpen])

  // 镜像最新宽度供 mouseup 持久化（effect 同步，避免在 render 中写 ref）
  useEffect(() => {
    latestWidthRef.current = width
  }, [width])

  // 面板每次打开时 clamp 恢复宽度（记忆值可能超出当前容器上限，如换小屏场景）
  useLayoutEffect(() => {
    if (!open) return
    const aside = asideRef.current
    if (!aside) return
    const maxWidth = computeAiAsideMaxWidth(aside)
    setWidth((prev) => Math.min(Math.max(prev, MIN_AI_ASIDE_WIDTH), maxWidth))
  }, [open])

  // 拖拽期间挂 document 级监听（指针移出手柄也能持续跟手），并全局禁止文本选中
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: globalThis.MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      // 面板在右侧：向左拖（deltaX 为负）变宽
      const next = Math.min(
        Math.max(drag.startWidth - (e.clientX - drag.startX), MIN_AI_ASIDE_WIDTH),
        drag.maxWidth
      )
      setWidth(next)
      latestWidthRef.current = next
    }
    const onUp = () => {
      setDragging(false)
      saveAiAsideWidth(latestWidthRef.current)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.classList.add('ai-aside-resizing')
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.classList.remove('ai-aside-resizing')
    }
  }, [dragging])

  const handleResizeStart = (e: ReactMouseEvent) => {
    e.preventDefault()
    const aside = asideRef.current
    if (!aside) return
    dragRef.current = {
      startX: e.clientX,
      startWidth: latestWidthRef.current,
      maxWidth: computeAiAsideMaxWidth(aside),
    }
    setDragging(true)
  }

  if (!aiPanelOpen) return null

  return (
    <ConfigProvider theme={companyTheme}>
      <div
        ref={asideRef}
        className="ai-assistant-aside"
        style={{ '--ai-aside-width': `${width}px` } as CSSProperties}
      >
        <div
          className={`ai-assistant-aside__resize-handle${dragging ? ' is-dragging' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="拖拽调整 AI 面板宽度"
          onMouseDown={handleResizeStart}
        />
        <AiAsideBody />
      </div>
    </ConfigProvider>
  )
}
