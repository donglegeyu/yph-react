import { useState, useCallback } from 'react'
import { CompanyMessage as message } from '@donglegeyu/company-ui'

export interface DesignToken {
  id: number
  categoryId: number
  categoryCode: string
  name: string
  tokenKey: string
  tokenType: string
  defaultValue: string
  currentValue: string
  customValue?: string
  description?: string
  isAntDesignToken: boolean
  antDesignTokenName?: string
  sortOrder: number
  updatedAt?: string
}

export interface TokenCategory {
  id: number
  name: string
  code: string
  sortOrder: number
  tokenCount?: number
}

export interface ComponentToken {
  id: number
  componentName: string
  tokenKey: string
  tokenType: string
  defaultLightValue: string
  defaultDarkValue: string
  currentLightValue: string
  currentDarkValue: string
  description?: string
  sortOrder: number
}

const DESIGN_TOKENS_API = '/api/design-tokens'
const COMPONENT_TOKENS_API = '/api/component-tokens'

export function useDesignTokens() {
  const [tokens, setTokens] = useState<DesignToken[]>([])
  const [categories, setCategories] = useState<TokenCategory[]>([])
  const [componentTokens, setComponentTokens] = useState<ComponentToken[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const loadTokens = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(DESIGN_TOKENS_API)
      const json = await res.json()
      if (json.code === 200) {
        const loadedTokens: DesignToken[] = (json.data.tokens || []).map((t: DesignToken) => ({
          ...t,
          defaultValue: t.tokenType === 'color' && t.defaultValue ? t.defaultValue.toUpperCase() : t.defaultValue,
          currentValue: t.tokenType === 'color' && t.currentValue ? t.currentValue.toUpperCase() : t.currentValue,
        }))
        setTokens(loadedTokens)
        setCategories(json.data.categories || [])
        setHasLoaded(true)
      } else {
        throw new Error(json.message || '加载 Token 失败')
      }
    } catch (error) {
      console.error('[useDesignTokens] loadTokens 失败:', error)
      message.error('加载 Design Tokens 失败')
    } finally {
      setLoading(false)
    }
  }, [loading])

  const loadComponentTokens = useCallback(async () => {
    try {
      const res = await fetch(COMPONENT_TOKENS_API)
      const json = await res.json()
      if (json.code === 200) {
        setComponentTokens(json.data.tokens || [])
      } else {
        throw new Error(json.message || '加载组件 Token 失败')
      }
    } catch (error) {
      console.error('[useDesignTokens] loadComponentTokens 失败:', error)
    }
  }, [])

  const updateToken = useCallback(async (tokenId: number, newValue: string) => {
    const normalizedValue = newValue.toUpperCase()
    try {
      const res = await fetch(`${DESIGN_TOKENS_API}/${tokenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue: normalizedValue }),
      })
      const json = await res.json()
      if (json.code === 200) {
        setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, currentValue: normalizedValue } : t))
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] updateToken 失败:', error)
      message.error('更新 Token 失败')
    }
  }, [])

  const batchUpdateTokens = useCallback(async (tokenUpdates: { id: number; currentValue: string }[]) => {
    try {
      const res = await fetch(`${DESIGN_TOKENS_API}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenUpdates),
      })
      const json = await res.json()
      if (json.code === 200) {
        setTokens(prev => prev.map(t => {
          const update = tokenUpdates.find(u => u.id === t.id)
          return update ? { ...t, currentValue: update.currentValue } : t
        }))
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] batchUpdateTokens 失败:', error)
      message.error('批量更新失败')
    }
  }, [])

  const saveAndApply = useCallback(async () => {
    try {
      const changedTokens = tokens
        .filter(t => t.currentValue !== t.defaultValue)
        .map(t => ({ id: t.id, currentValue: t.currentValue }))
      if (changedTokens.length > 0) {
        await batchUpdateTokens(changedTokens)
      }
      message.success('Design Tokens 已成功应用')
    } catch (error) {
      message.error('保存失败')
    }
  }, [tokens, batchUpdateTokens])

  const resetToDefault = useCallback(async () => {
    try {
      const res = await fetch(`${DESIGN_TOKENS_API}/reset`, { method: 'POST' })
      const json = await res.json()
      if (json.code === 200) {
        setTokens(prev => prev.map(t => ({ ...t, currentValue: t.defaultValue })))
        message.success('已重置为默认配置')
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] resetToDefault 失败:', error)
      message.error('重置失败')
    }
  }, [])

  const updateComponentToken = useCallback(async (tokenId: number, lightValue?: string, darkValue?: string) => {
    try {
      const res = await fetch(`${COMPONENT_TOKENS_API}/${tokenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentLightValue: lightValue, currentDarkValue: darkValue }),
      })
      const json = await res.json()
      if (json.code === 200) {
        setComponentTokens(prev => prev.map(t =>
          t.id === tokenId
            ? { ...t, currentLightValue: lightValue ?? t.currentLightValue, currentDarkValue: darkValue ?? t.currentDarkValue }
            : t
        ))
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] updateComponentToken 失败:', error)
      message.error('更新组件 Token 失败')
    }
  }, [])

  const batchUpdateComponentTokens = useCallback(async (
    tokenUpdates: { id: number; currentLightValue?: string; currentDarkValue?: string }[]
  ) => {
    try {
      const res = await fetch(`${COMPONENT_TOKENS_API}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenUpdates),
      })
      const json = await res.json()
      if (json.code === 200) {
        setComponentTokens(prev => prev.map(t => {
          const update = tokenUpdates.find(u => u.id === t.id)
          return update
            ? { ...t, currentLightValue: update.currentLightValue ?? t.currentLightValue, currentDarkValue: update.currentDarkValue ?? t.currentDarkValue }
            : t
        }))
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] batchUpdateComponentTokens 失败:', error)
      message.error('批量更新组件 Token 失败')
    }
  }, [])

  const resetComponentTokensToDefault = useCallback(async () => {
    try {
      const res = await fetch(`${COMPONENT_TOKENS_API}/reset`, { method: 'POST' })
      const json = await res.json()
      if (json.code === 200) {
        setComponentTokens(prev => prev.map(t => ({
          ...t,
          currentLightValue: t.defaultLightValue,
          currentDarkValue: t.defaultDarkValue,
        })))
        message.success('已重置组件 Token 为默认配置')
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] resetComponentTokensToDefault 失败:', error)
      message.error('重置组件 Token 失败')
    }
  }, [])

  return {
    tokens,
    categories,
    componentTokens,
    loading,
    hasLoaded,
    loadTokens,
    loadComponentTokens,
    updateToken,
    batchUpdateTokens,
    saveAndApply,
    resetToDefault,
    updateComponentToken,
    batchUpdateComponentTokens,
    resetComponentTokensToDefault,
  }
}
