import { ref } from 'vue'
import { message } from 'ant-design-vue'

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

const DESIGN_TOKENS_API = '/api/design-tokens'
const COMPONENT_TOKENS_API = '/api/component-tokens'

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

export function useDesignTokens() {
  const tokens = ref<DesignToken[]>([])
  const categories = ref<TokenCategory[]>([])
  const componentTokens = ref<ComponentToken[]>([])
  const loading = ref(false)
  const hasLoaded = ref(false)

  async function loadTokens() {
    if (loading.value) return

    loading.value = true
    try {
      const res = await fetch(DESIGN_TOKENS_API)
      const json = await res.json()

      if (json.code === 200) {
        const loadedTokens = json.data.tokens || []
        loadedTokens.forEach((token: any) => {
          if (token.tokenType === 'color' && token.defaultValue) {
            token.defaultValue = token.defaultValue.toUpperCase()
          }
          if (token.tokenType === 'color' && token.currentValue) {
            token.currentValue = token.currentValue.toUpperCase()
          }
        })
        tokens.value = loadedTokens
        categories.value = json.data.categories || []
        hasLoaded.value = true
      } else {
        throw new Error(json.message || '加载 Token 失败')
      }
    } catch (error) {
      console.error('[useDesignTokens] loadTokens 失败:', error)
      message.error('加载 Design Tokens 失败')
    } finally {
      loading.value = false
    }
  }

  async function loadComponentTokens() {
    try {
      const res = await fetch(COMPONENT_TOKENS_API)
      const json = await res.json()

      if (json.code === 200) {
        componentTokens.value = json.data.tokens || []
      } else {
        throw new Error(json.message || '加载组件 Token 失败')
      }
    } catch (error) {
      console.error('[useDesignTokens] loadComponentTokens 失败:', error)
    }
  }

  async function updateToken(tokenId: number, newValue: string) {
    const normalizedValue = newValue.toUpperCase()
    try {
      const res = await fetch(`${DESIGN_TOKENS_API}/${tokenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue: normalizedValue }),
      })
      const json = await res.json()

      if (json.code === 200) {
        const token = tokens.value.find(t => t.id === tokenId)
        if (token) {
          token.currentValue = normalizedValue
        }
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] updateToken 失败:', error)
      message.error('更新 Token 失败')
    }
  }

  async function batchUpdateTokens(tokenUpdates: { id: number; currentValue: string }[]) {
    try {
      const res = await fetch(`${DESIGN_TOKENS_API}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenUpdates),
      })
      const json = await res.json()

      if (json.code === 200) {
        tokenUpdates.forEach(({ id, currentValue }) => {
          const token = tokens.value.find(t => t.id === id)
          if (token) {
            token.currentValue = currentValue
          }
        })
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] batchUpdateTokens 失败:', error)
      message.error('批量更新失败')
    }
  }

  async function saveAndApply() {
    try {
      const changedTokens = tokens.value
        .filter(t => t.currentValue !== t.defaultValue)
        .map(t => ({ id: t.id, currentValue: t.currentValue }))

      if (changedTokens.length > 0) {
        await batchUpdateTokens(changedTokens)
      }
      message.success('Design Tokens 已成功应用')
    } catch (error) {
      message.error('保存失败')
    }
  }

  async function resetToDefault() {
    try {
      const res = await fetch(`${DESIGN_TOKENS_API}/reset`, {
        method: 'POST',
      })
      const json = await res.json()

      if (json.code === 200) {
        tokens.value.forEach(token => {
          token.currentValue = token.defaultValue
        })
        message.success('已重置为默认配置')
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] resetToDefault 失败:', error)
      message.error('重置失败')
    }
  }

  async function updateComponentToken(
    tokenId: number,
    lightValue?: string,
    darkValue?: string
  ) {
    try {
      const res = await fetch(`${COMPONENT_TOKENS_API}/${tokenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLightValue: lightValue,
          currentDarkValue: darkValue,
        }),
      })
      const json = await res.json()

      if (json.code === 200) {
        const token = componentTokens.value.find(t => t.id === tokenId)
        if (token) {
          if (lightValue !== undefined) token.currentLightValue = lightValue
          if (darkValue !== undefined) token.currentDarkValue = darkValue
        }
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] updateComponentToken 失败:', error)
      message.error('更新组件 Token 失败')
    }
  }

  async function batchUpdateComponentTokens(
    tokenUpdates: { id: number; currentLightValue?: string; currentDarkValue?: string }[]
  ) {
    try {
      const res = await fetch(`${COMPONENT_TOKENS_API}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenUpdates),
      })
      const json = await res.json()

      if (json.code === 200) {
        tokenUpdates.forEach(({ id, currentLightValue, currentDarkValue }) => {
          const token = componentTokens.value.find(t => t.id === id)
          if (token) {
            if (currentLightValue !== undefined) token.currentLightValue = currentLightValue
            if (currentDarkValue !== undefined) token.currentDarkValue = currentDarkValue
          }
        })
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] batchUpdateComponentTokens 失败:', error)
      message.error('批量更新组件 Token 失败')
    }
  }

  async function resetComponentTokensToDefault() {
    try {
      const res = await fetch(`${COMPONENT_TOKENS_API}/reset`, {
        method: 'POST',
      })
      const json = await res.json()

      if (json.code === 200) {
        componentTokens.value.forEach(token => {
          token.currentLightValue = token.defaultLightValue
          token.currentDarkValue = token.defaultDarkValue
        })
        message.success('已重置组件 Token 为默认配置')
      } else {
        throw new Error(json.message)
      }
    } catch (error) {
      console.error('[useDesignTokens] resetComponentTokensToDefault 失败:', error)
      message.error('重置组件 Token 失败')
    }
  }

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
