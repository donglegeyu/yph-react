/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react'

export interface Domain {
  id: number
  domainKey: string
  domainName: string
  description: string
  isDefault: number
  status: number
  createTime: string
  updateTime: string
  deleted: number
}

export interface SysUser {
  id: number
  username: string
  password?: string
  nickname: string
  status: number
  createTime: string
  updateTime: string
  deleted: number
}

export function useDomains() {

  const fetchAllDomains = useCallback(async (): Promise<Domain[]> => {
    try {
      const res = await fetch('/api/sys/domains/all')
      const json = await res.json()
      if (json.code === 200) return json.data || []
      return []
    } catch {
      return []
    }
  }, [])

  const getDomain = useCallback(async (id: number): Promise<Domain | null> => {
    try {
      const res = await fetch(`/api/sys/domains/${id}`)
      const json = await res.json()
      if (json.code === 200) return json.data
      return null
    } catch {
      return null
    }
  }, [])

  const createDomain = useCallback(async (data: Partial<Domain>): Promise<boolean> => {
    try {
      const res = await fetch('/api/sys/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      return json.code === 200
    } catch {
      return false
    }
  }, [])

  const updateDomain = useCallback(async (id: number, data: Partial<Domain>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sys/domains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      return json.code === 200
    } catch {
      return false
    }
  }, [])

  const updateDomainStatus = useCallback(async (id: number, status: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sys/domains/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      return json.code === 200
    } catch {
      return false
    }
  }, [])

  const deleteDomain = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sys/domains/${id}`, { method: 'DELETE' })
      const json = await res.json()
      return json.code === 200
    } catch {
      return false
    }
  }, [])

  return {
    fetchAllDomains,
    getDomain,
    createDomain,
    updateDomain,
    updateDomainStatus,
    deleteDomain,
  }
}

export function useSysUsers() {

  const fetchUserDomains = useCallback(async (userId: number): Promise<Domain[]> => {
    try {
      const res = await fetch(`/api/sys/users/${userId}/domains`)
      const json = await res.json()
      if (json.code === 200) return json.data || []
      return []
    } catch {
      return []
    }
  }, [])

  const assignDomains = useCallback(async (userId: number, domainIds: number[]): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sys/users/${userId}/domains`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainIds }),
      })
      const json = await res.json()
      return json.code === 200
    } catch {
      return false
    }
  }, [])

  const updateUserStatus = useCallback(async (id: number, status: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sys/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      return json.code === 200
    } catch {
      return false
    }
  }, [])

  const createUser = useCallback(async (data: Partial<SysUser>): Promise<number | null> => {
    try {
      const res = await fetch('/api/sys/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.code === 200 && json.data) return json.data
      return null
    } catch {
      return null
    }
  }, [])

  const updateUser = useCallback(async (id: number, data: Partial<SysUser>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sys/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      return json.code === 200
    } catch {
      return false
    }
  }, [])

  const getUserPermissions = useCallback(async (userId: number): Promise<any> => {
    try {
      const res = await fetch(`/api/sys/users/${userId}/permissions`)
      const json = await res.json()
      if (json.code === 200) return json.data
      return null
    } catch {
      return null
    }
  }, [])

  const getDomainUsers = useCallback(async (domainId: number): Promise<SysUser[]> => {
    try {
      const res = await fetch(`/api/sys/domains/${domainId}/users`)
      const json = await res.json()
      if (json.code === 200) return json.data?.users || []
      return []
    } catch {
      return []
    }
  }, [])

  return {
    fetchUserDomains,
    assignDomains,
    updateUserStatus,
    createUser,
    updateUser,
    getUserPermissions,
    getDomainUsers,
  }
}
