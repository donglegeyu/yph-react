import { useState, useCallback } from 'react'

export interface StatusConfig {
  text: string
  color: string
  [key: string]: any
}

export interface UseStatusMapOptions {
  defaultStatusMap?: Record<string, StatusConfig>
}

export function useStatusMap(options: UseStatusMapOptions = {}) {
  const [statusMap, setStatusMap] = useState<Record<string, StatusConfig>>(
    options.defaultStatusMap || {}
  )

  const registerStatusMap = useCallback((map: Record<string, StatusConfig>) => {
    setStatusMap(map)
  }, [])

  const addStatus = useCallback((key: string, config: StatusConfig) => {
    setStatusMap((prev) => ({ ...prev, [key]: config }))
  }, [])

  const getStatusText = useCallback(
    (status: string): string => {
      if (!status) return ''
      return statusMap[status]?.text || status
    },
    [statusMap]
  )

  const getStatusColor = useCallback(
    (status: string): string => {
      return statusMap[status]?.color || 'default'
    },
    [statusMap]
  )

  const getStatusConfig = useCallback(
    (status: string): StatusConfig | undefined => {
      return statusMap[status]
    },
    [statusMap]
  )

  const hasStatus = useCallback(
    (status: string): boolean => {
      return status in statusMap
    },
    [statusMap]
  )

  const getAllStatuses = useCallback((): Array<{ key: string; config: StatusConfig }> => {
    return Object.entries(statusMap).map(([key, config]) => ({ key, config }))
  }, [statusMap])

  const clearStatusMap = useCallback(() => {
    setStatusMap({})
  }, [])

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
