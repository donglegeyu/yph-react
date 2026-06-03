import { useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'theme-mode'

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) === 'dark'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark-theme')
      root.classList.remove('light-theme')
    } else {
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    }
  }, [isDark])

  const toggleTheme = useCallback(async () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    const mode: ThemeMode = nextDark ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, mode)
  }, [isDark])

  const setTheme = useCallback(async (mode: ThemeMode) => {
    setIsDark(mode === 'dark')
    localStorage.setItem(STORAGE_KEY, mode)
  }, [])

  useEffect(() => {
    const loadFromServer = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/theme/current')
        const json = await res.json()
        if (json.code === 200 && json.data) {
          const mode = json.data as ThemeMode
          setIsDark(mode === 'dark')
          localStorage.setItem(STORAGE_KEY, mode)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadFromServer()
  }, [])

  return { isDark, loading, toggleTheme, setTheme }
}
