import { useCallback, useEffect, useState } from 'react'
import { Select, Card, Descriptions, Tag, Space, Tree, Empty, Spin } from 'antd'
import type { TreeDataNode } from 'antd'
import { CompanyTag } from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useMenuTitle } from '@/hooks'

interface UserOption {
  id: number
  username: string
  nickname: string
  realName?: string
}

interface RoleBrief {
  id: number
  roleName: string
  roleCode: string
}

interface MenuNode {
  id: number
  key: string
  label: string
  path: string
  menuCategory: string
  parentId: number
  children?: MenuNode[]
}

interface DataScopeInfo {
  type: number
  description: string
  deptIds: number[]
  deptNames: string[]
}

interface DomainItem {
  id: number
  domainName: string
  domainKey: string
}

interface PermissionData {
  user: UserOption & { deptName?: string; status?: number }
  domains: DomainItem[]
  rbac: {
    roles: RoleBrief[]
    menus: MenuNode[]
    permissions: string[]
    dataScope: DataScopeInfo
  }
}

function buildTreeData(menus: MenuNode[]): TreeDataNode[] {
  return menus.map((m) => ({
    key: m.id,
    title: (
      <Space size={4}>
        <span>{m.label}</span>
        {m.menuCategory && (
          <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
            [{m.menuCategory === 'M' ? '目录' : m.menuCategory === 'C' ? '菜单' : m.menuCategory === 'F' ? '按钮' : m.menuCategory}]
          </span>
        )}
      </Space>
    ),
    children: m.children && m.children.length > 0 ? buildTreeData(m.children) : undefined,
  }))
}

export default function PermissionQuery() {
  const menuTitle = useMenuTitle()
  const [userList, setUserList] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null)

  const fetchUserList = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.SYS_USERS}?size=1000`)
      const json = await res.json()
      if (json.code === 200) {
        setUserList(json.data || [])
      }
    } catch {
      /* ignore */
    }
  }, [])

  const fetchPermissions = useCallback(async (userId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_ENDPOINTS.SYS_USERS}/${userId}/permissions`)
      const json = await res.json()
      if (json.code === 200) {
        setPermissionData(json.data)
      } else {
        setPermissionData(null)
      }
    } catch {
      setPermissionData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUserChange = useCallback((userId: number) => {
    setSelectedUserId(userId)
    fetchPermissions(userId)
  }, [fetchPermissions])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rbac = permissionData?.rbac
  const dataScope = rbac?.dataScope
  const dataScopeColorMap: Record<number, string> = {
    1: 'red', 2: 'gold', 3: 'green', 4: 'cyan', 5: 'default',
  }

  return (
    <div style={{ padding: 16 }}>
      <Card title={menuTitle || '权限查询'} style={{ marginBottom: 16 }}>
        <Space>
          <span>选择用户：</span>
          <Select
            showSearch
            style={{ width: 320 }}
            placeholder="请选择要查询的用户"
            value={selectedUserId}
            onChange={handleUserChange}
            optionFilterProp="label"
            options={userList.map((u) => ({
              label: `${u.username}${u.realName ? `（${u.realName}）` : ''}`,
              value: u.id,
            }))}
          />
        </Space>
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin tip="加载权限数据中..." />
        </div>
      )}

      {!loading && !permissionData && (
        <Card>
          <Empty description="请选择用户查看权限详情" />
        </Card>
      )}

      {!loading && permissionData && rbac && (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {/* 基础信息 */}
          <Card title="基础信息" size="small">
            <Descriptions column={3} size="small">
              <Descriptions.Item label="用户名">
                {permissionData.user.username}
              </Descriptions.Item>
              <Descriptions.Item label="姓名">
                {permissionData.user.realName || permissionData.user.nickname || '--'}
              </Descriptions.Item>
              <Descriptions.Item label="所属公司">
                {permissionData.rbac?.companyName || '--'}
              </Descriptions.Item>
              <Descriptions.Item label="所属部门">
                {permissionData.rbac?.deptName || permissionData.user.deptName || '--'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 角色信息 */}
          <Card title="分配角色" size="small">
            {rbac.roles.length === 0 ? (
              <span style={{ color: 'rgba(0,0,0,0.45)' }}>暂未分配角色</span>
            ) : (
              <Space size={[8, 8]} wrap>
                {rbac.roles.map((role) => (
                  <CompanyTag key={role.id} color="warning">
                    {role.roleName}（{role.roleCode}）
                  </CompanyTag>
                ))}
              </Space>
            )}
          </Card>

          {/* 数据范围 */}
          <Card title="数据范围" size="small">
            <Space direction="vertical" size={8}>
              <div>
                <Tag color={dataScopeColorMap[dataScope?.type || 5] || 'default'}>
                  {dataScope?.description || '未知'}
                </Tag>
              </div>
              {dataScope?.type === 2 && dataScope.deptNames && dataScope.deptNames.length > 0 && (
                <div>
                  <span style={{ color: 'rgba(0,0,0,0.45)', marginRight: 8 }}>可见部门：</span>
                  <Space size={[4, 4]} wrap>
                    {dataScope.deptNames.map((name, idx) => (
                      <Tag key={idx} color="blue">{name}</Tag>
                    ))}
                  </Space>
                </div>
              )}
            </Space>
          </Card>

          {/* 关联域 */}
          <Card title="关联域" size="small">
            {permissionData.domains.length === 0 ? (
              <span style={{ color: 'rgba(0,0,0,0.45)' }}>暂未分配域</span>
            ) : (
              <Space size={[8, 8]} wrap>
                {permissionData.domains.map((domain) => (
                  <CompanyTag key={domain.id} color="processing">
                    {domain.domainName}
                  </CompanyTag>
                ))}
              </Space>
            )}
          </Card>

          {/* 菜单权限 */}
          <Card
            title={`菜单权限（${rbac.menus.length} 个根节点）`}
            size="small"
          >
            {rbac.menus.length === 0 ? (
              <span style={{ color: 'rgba(0,0,0,0.45)' }}>暂无菜单权限</span>
            ) : (
              <Tree
                showLine
                defaultExpandAll
                treeData={buildTreeData(rbac.menus)}
              />
            )}
          </Card>

          {/* 按钮权限标识 */}
          <Card title={`按钮/接口权限标识（${rbac.permissions.length} 个）`} size="small">
            {rbac.permissions.length === 0 ? (
              <span style={{ color: 'rgba(0,0,0,0.45)' }}>暂无按钮权限标识（现有菜单未配置 perms 字段）</span>
            ) : (
              <Space size={[4, 4]} wrap>
                {rbac.permissions.map((perm) => (
                  <Tag key={perm} color="purple" style={{ fontFamily: 'monospace' }}>
                    {perm}
                  </Tag>
                ))}
              </Space>
            )}
          </Card>
        </Space>
      )}
    </div>
  )
}
