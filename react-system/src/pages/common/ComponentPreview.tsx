import { useState, useEffect } from 'react'
import { Tabs } from 'antd'
import { PageTitle } from '@donglegeyu/company-ui'
import './ComponentPreview.scss'

export default function ComponentPreview() {
  const [businessTokenTabKey, setBusinessTokenTabKey] = useState('config')
  const [tokensWidth, setTokensWidth] = useState(360)
  const [isTokensDragging, setIsTokensDragging] = useState(false)

  function startTokensDrag(e: React.MouseEvent) {
    setIsTokensDragging(true)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', onTokensDrag)
    document.addEventListener('mouseup', stopTokensDrag)
    e.preventDefault()
  }

  function onTokensDrag(e: MouseEvent) {
    if (!isTokensDragging) return
    const newWidth = window.innerWidth - e.clientX
    if (newWidth >= 100) {
      setTokensWidth(newWidth)
    }
  }

  function stopTokensDrag() {
    setIsTokensDragging(false)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', onTokensDrag)
    document.removeEventListener('mouseup', stopTokensDrag)
  }

  useEffect(() => {
    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onTokensDrag)
      document.removeEventListener('mouseup', stopTokensDrag)
    }
  }, [])

  return (
    <div className="component-preview">
      <PageTitle title="主题设置" />

        <div className="components-layout" style={{ height: '100%' }}>
          <div className="components-content">
            <div className="component-demo">
              <div className="demo-section">
                <h3 className="component-title">暂无业务组件</h3>
              </div>
            </div>
          </div>

          <div className="components-divider" onMouseDown={startTokensDrag}>
            <div className="drag-handle" />
          </div>

          <div className="components-tokens" style={{ width: tokensWidth }}>
            <Tabs
              size="small"
              activeKey={businessTokenTabKey}
              onChange={setBusinessTokenTabKey}
              items={[
                {
                  key: 'config',
                  label: '配置',
                  children: <div className="config-panel"><div className="tokens-empty">暂无配置项</div></div>,
                },
              ]}
            />
          </div>
        </div>
    </div>
  )
}
