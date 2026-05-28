import { ref } from 'vue'
import { useListData } from './useListData'

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

export function useDomains(options?: { autoFetch?: boolean }) {
  const { autoFetch = false } = options || {}

  const { loading, dataSource, pagination, fetchData, refresh, handlePageChange, setPagination } = useListData<Domain>({
    apiEndpoint: '/api/sys/domains',
    defaultPageSize: 20,
    autoFetch,
    transformResponse: (data) => data,
  })

  const filterParams = ref({
    domainName: '',
    status: '',
  })

  async function fetchAllDomains(): Promise<Domain[]> {
    try {
      const res = await fetch('/api/sys/domains/all')
      const json = await res.json()
      if (json.code === 200) {
        return json.data || []
      }
      return []
    } catch {
      return []
    }
  }

  async function getDomain(id: number): Promise<Domain | null> {
    try {
      const res = await fetch(`/api/sys/domains/${id}`)
      const json = await res.json()
      if (json.code === 200) {
        return json.data
      }
      return null
    } catch {
      return null
    }
  }

  async function createDomain(data: Partial<Domain>): Promise<boolean> {
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
  }

  async function updateDomain(id: number, data: Partial<Domain>): Promise<boolean> {
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
  }

  async function updateDomainStatus(id: number, status: number): Promise<boolean> {
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
  }

  async function deleteDomain(id: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/sys/domains/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      return json.code === 200
    } catch {
      return false
    }
  }

  return {
    loading,
    dataSource,
    pagination,
    filterParams,
    fetchData,
    refresh,
    handlePageChange,
    setPagination,
    fetchAllDomains,
    getDomain,
    createDomain,
    updateDomain,
    updateDomainStatus,
    deleteDomain,
  }
}

export function useSysUsers(options?: { autoFetch?: boolean }) {
  const { autoFetch = false } = options || {}

  const { loading, dataSource, pagination, fetchData, refresh, handlePageChange } = useListData<SysUser>({
    apiEndpoint: '/api/sys/users',
    defaultPageSize: 20,
    autoFetch,
    transformResponse: (data) => data,
  })

  const filterParams = ref({
    username: '',
    status: '',
  })

  async function fetchUserDomains(userId: number): Promise<Domain[]> {
    try {
      const res = await fetch(`/api/sys/users/${userId}/domains`)
      const json = await res.json()
      if (json.code === 200) {
        return json.data || []
      }
      return []
    } catch {
      return []
    }
  }

  async function assignDomains(userId: number, domainIds: number[]): Promise<boolean> {
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
  }

  async function updateUserStatus(id: number, status: number): Promise<boolean> {
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
  }

  async function createUser(data: Partial<SysUser>): Promise<number | null> {
    try {
      const res = await fetch('/api/sys/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.code === 200 && json.data) {
        return json.data
      }
      return null
    } catch {
      return null
    }
  }

  async function updateUser(id: number, data: Partial<SysUser>): Promise<boolean> {
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
  }

  async function getUserPermissions(userId: number): Promise<any> {
    try {
      const res = await fetch(`/api/sys/users/${userId}/permissions`)
      const json = await res.json()
      if (json.code === 200) {
        return json.data
      }
      return null
    } catch {
      return null
    }
  }

  async function getDomainUsers(domainId: number): Promise<SysUser[]> {
    try {
      const res = await fetch(`/api/sys/domains/${domainId}/users`)
      const json = await res.json()
      if (json.code === 200) {
        return json.data?.users || []
      }
      return []
    } catch {
      return []
    }
  }

  return {
    loading,
    dataSource,
    pagination,
    filterParams,
    fetchData,
    refresh,
    handlePageChange,
    fetchUserDomains,
    assignDomains,
    updateUserStatus,
    createUser,
    updateUser,
    getUserPermissions,
    getDomainUsers,
  }
}
