import { useState, useEffect, useCallback } from 'react'
import { CompanyMessage as message } from '@donglegeyu/company-ui'

export type ThemeMode = 'light' | 'dark'

interface ThemeConfig {
  primary: string
  primaryHover: string
  success: string
  warning: string
  error: string
  info: string
  text: string
  textSecondary: string
  border: string
  bgContainer: string
  bgLayout: string
  bgElevated: string
}

const DEFAULT_COLORS: Record<ThemeMode, ThemeConfig> = {
  light: {
    primary: '#F95914',
    primaryHover: '#FF7043',
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF4D4F',
    info: '#1890FF',
    text: '#000000E6',
    textSecondary: '#00000073',
    border: '#D9D9D9',
    bgContainer: '#FFFFFF',
    bgLayout: '#F5F5F5',
    bgElevated: '#FFFFFF',
  },
  dark: {
    primary: '#FF6A3D',
    primaryHover: '#FF8A5C',
    success: '#73D13D',
    warning: '#FFC53D',
    error: '#FF7875',
    info: '#69C0FF',
    text: '#FFFFFFE6',
    textSecondary: '#FFFFFFB3',
    border: '#434343',
    bgContainer: '#1F1F1F',
    bgLayout: '#000000',
    bgElevated: '#262626',
  },
}

const STORAGE_KEY = 'theme-mode'
const API_BASE = '/api/theme'

function applyThemeColors(mode: ThemeMode) {
  const colors = DEFAULT_COLORS[mode]
  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  root.style.setProperty('--primary-color', colors.primary)
  root.style.setProperty('--primary-hover', colors.primaryHover)
  root.style.setProperty('--color-success', colors.success)
  root.style.setProperty('--color-warning', colors.warning)
  root.style.setProperty('--color-error', colors.error)
  root.style.setProperty('--color-info', colors.info)
  root.style.setProperty('--color-text', colors.text)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-bg-container', colors.bgContainer)
  root.style.setProperty('--color-bg-layout', colors.bgLayout)
  root.style.setProperty('--color-bg-elevated', colors.bgElevated)
  if (mode === 'dark') {
    root.classList.add('dark-theme')
    root.classList.remove('light-theme')
  } else {
    root.classList.add('light-theme')
    root.classList.remove('dark-theme')
  }
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) === 'dark'
  })
  const [loading, setLoading] = useState(false)

  const toggleTheme = useCallback(async () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    const mode: ThemeMode = nextDark ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, mode)
    applyThemeColors(mode)
    try {
      await fetch(`${API_BASE}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: mode }),
      })
    } catch {
      // ignore
    }
  }, [isDark])

  const setTheme = useCallback(async (mode: ThemeMode) => {
    setIsDark(mode === 'dark')
    localStorage.setItem(STORAGE_KEY, mode)
    applyThemeColors(mode)
    try {
      await fetch(`${API_BASE}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: mode }),
      })
      message.success(`已切换到${mode === 'dark' ? '深色' : '浅色'}主题`)
    } catch {
      message.error('切换主题失败')
    }
  }, [])

  useEffect(() => {
    const loadFromServer = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/current`)
        const json = await res.json()
        if (json.code === 200 && json.data) {
          const mode = json.data as ThemeMode
          setIsDark(mode === 'dark')
          applyThemeColors(mode)
          localStorage.setItem(STORAGE_KEY, mode)
        }
      } catch {
        const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'light'
        setIsDark(stored === 'dark')
        applyThemeColors(stored)
      } finally {
        setLoading(false)
      }
    }
    loadFromServer()
  }, [])

  return { isDark, loading, toggleTheme, setTheme }
}
