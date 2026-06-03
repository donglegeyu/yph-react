import { ThemeProvider } from '@donglegeyu/company-ui'
import { RouterProvider } from 'react-router-dom'
import { Suspense, useEffect, Component, type ErrorInfo, type ReactNode } from 'react'
import { CompanySpin } from '@donglegeyu/company-ui'
import router from '@/router'

class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 20, color: 'rgba(0,0,0,0.88)', marginBottom: 12 }}>
            应用出错了
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(0,0,0,0.45)',
              maxWidth: 480,
              textAlign: 'center',
              wordBreak: 'break-all',
            }}
          >
            {this.state.error?.message || String(this.state.error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24,
              padding: '8px 24px',
              borderRadius: 6,
              border: '1px solid #d9d9d9',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              color: 'rgba(0,0,0,0.88)',
            }}
          >
            重新加载
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

async function loadSvgSprite() {
  try {
    const res = await fetch('/iconpark/sprite_nav.svg')
    if (res.ok) {
      const svgText = await res.text()
      const div = document.createElement('div')
      div.innerHTML = svgText
      div.style.display = 'none'
      document.body.appendChild(div)
    }
  } catch {
    console.error('加载图标失败')
  }
}

function AppInit() {
  useEffect(() => {
    loadSvgSprite()
  }, [])
  return null
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <AppInit />
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
              }}
            >
              <CompanySpin size="large" />
            </div>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
      </ThemeProvider>
    </GlobalErrorBoundary>
  )
}
