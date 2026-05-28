import { ref, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useCssVariables } from './useCssVariables'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'theme-mode'
const API_BASE = '/api/theme'

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

interface ThemeColors {
  light: ThemeConfig
  dark: ThemeConfig
}

const DEFAULT_COLORS: ThemeColors = {
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

export function useDarkMode() {
  const isDark = ref<boolean>(false)
  const loading = ref<boolean>(false)
  const cssVars = useCssVariables()

  function getStoredTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return (stored as ThemeMode) || 'light'
    } catch {
      return 'light'
    }
  }

  function setStoredTheme(mode: ThemeMode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch (e) {
      console.error('[useDarkMode] 保存主题失败:', e)
    }
  }

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

    console.log(`[useDarkMode] 主题切换为: ${mode}`)
  }

  async function toggleTheme() {
    isDark.value = !isDark.value
    const mode: ThemeMode = isDark.value ? 'dark' : 'light'

    setStoredTheme(mode)
    applyThemeColors(mode)

    try {
      await fetch(`${API_BASE}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: mode }),
      })
      console.log('[useDarkMode] 主题已同步到服务器')
    } catch (error) {
      console.error('[useDarkMode] 同步主题失败:', error)
    }
  }

  async function setTheme(mode: ThemeMode) {
    isDark.value = mode === 'dark'

    setStoredTheme(mode)
    applyThemeColors(mode)

    try {
      await fetch(`${API_BASE}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: mode }),
      })
      message.success(`已切换到${mode === 'dark' ? '深色' : '浅色'}主题`)
    } catch (error) {
      console.error('[useDarkMode] 切换主题失败:', error)
      message.error('切换主题失败')
    }
  }

  async function loadThemeFromServer() {
    loading.value = true
    try {
      const res = await fetch(`${API_BASE}/current`)
      const json = await res.json()

      if (json.code === 200 && json.data) {
        const mode = json.data as ThemeMode
        isDark.value = mode === 'dark'
        applyThemeColors(mode)
        setStoredTheme(mode)
        console.log('[useDarkMode] 从服务器加载主题:', mode)
      }
    } catch (error) {
      console.error('[useDarkMode] 从服务器加载主题失败:', error)
      const stored = getStoredTheme()
      isDark.value = stored === 'dark'
      applyThemeColors(stored)
    } finally {
      loading.value = false
    }
  }

  function init() {
    const stored = getStoredTheme()
    isDark.value = stored === 'dark'
    applyThemeColors(stored)
  }

  watch(isDark, (newValue) => {
    const mode: ThemeMode = newValue ? 'dark' : 'light'
    setStoredTheme(mode)
    applyThemeColors(mode)
  })

  onMounted(() => {
    loadThemeFromServer()
  })

  return {
    isDark,
    loading,
    toggleTheme,
    setTheme,
    init,
  }
}
