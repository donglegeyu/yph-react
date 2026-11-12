import { useEffect, useState } from 'react'
import { CompanyMessage } from '@donglegeyu/company-ui'
import { fetchSysUsers, type SysUserItem } from './api'

/** 一次性拉取主服务用户列表，供转办/加签/抄送选人共用 */
export function useSysUsers() {
  const [users, setUsers] = useState<SysUserItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSysUsers()
      .then((res) => {
        if (res.code === 200 && res.data) {
          setUsers(res.data)
        } else {
          CompanyMessage.error(res.message || '用户列表加载失败')
        }
      })
      .catch(() => CompanyMessage.error('用户列表加载失败'))
      .finally(() => setLoading(false))
  }, [])

  return { users, loading }
}
