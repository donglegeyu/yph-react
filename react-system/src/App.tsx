import { ThemeProvider } from '@donglegeyu/company-ui'
import { RouterProvider } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import { CompanySpin } from '@donglegeyu/company-ui'
import router from '@/router'

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
  )
}
