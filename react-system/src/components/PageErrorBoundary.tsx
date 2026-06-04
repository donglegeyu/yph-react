import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CompanyModal, CompanyButton } from '@donglegeyu/company-ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary]', error, info.componentStack)
  }

  handleClose = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    return (
      <>
        {this.props.children}
        <CompanyModal
          open={this.state.hasError}
          title="页面出现错误"
          closable={false}
          maskClosable={false}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <CompanyButton onClick={this.handleClose}>关闭提示</CompanyButton>
              <CompanyButton type="primary" onClick={this.handleReload}>
                重新加载
              </CompanyButton>
            </div>
          }
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ color: 'rgba(0,0,0,0.65)', marginBottom: 12 }}>
              页面渲染过程中发生错误，但页面框架仍可正常使用。
            </p>
            <div
              style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                fontSize: 13,
                color: '#cf1322',
                wordBreak: 'break-all',
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {this.state.error?.message || String(this.state.error)}
            </div>
          </div>
        </CompanyModal>
      </>
    )
  }
}
