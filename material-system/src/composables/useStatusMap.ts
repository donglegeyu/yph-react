import { ref } from 'vue'

export interface StatusConfig {
  text: string
  color: string
  [key: string]: any
}

export interface UseStatusMapOptions {
  defaultStatusMap?: Record<string, StatusConfig>
}

export function useStatusMap(options: UseStatusMapOptions = {}) {
  const statusMap = ref<Record<string, StatusConfig>>(options.defaultStatusMap || {})

  function registerStatusMap(map: Record<string, StatusConfig>) {
    statusMap.value = map
  }

  function addStatus(key: string, config: StatusConfig) {
    statusMap.value[key] = config
  }

  function getStatusText(status: string): string {
    if (!status) return ''
    return statusMap.value[status]?.text || status
  }

  function getStatusColor(status: string): string {
    return statusMap.value[status]?.color || 'default'
  }

  function getStatusConfig(status: string): StatusConfig | undefined {
    return statusMap.value[status]
  }

  function hasStatus(status: string): boolean {
    return status in statusMap.value
  }

  function getAllStatuses(): Array<{ key: string; config: StatusConfig }> {
    return Object.entries(statusMap.value).map(([key, config]) => ({
      key,
      config,
    }))
  }

  function clearStatusMap() {
    statusMap.value = {}
  }

  return {
    statusMap,
    registerStatusMap,
    addStatus,
    getStatusText,
    getStatusColor,
    getStatusConfig,
    hasStatus,
    getAllStatuses,
    clearStatusMap,
  }
}
