import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Radio, Checkbox, Space, TreeSelect, Select } from 'antd'
import {
  CompanyButton,
  CompanyDrawer,
  CompanyMessage,
  CompanyTag,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData, useMenuTitle, useSysUsers, useDomains } from '@/hooks'
import type { Domain } from '@/hooks'

interface DomainBrief {
  id: number
  domainName: string
}

interface RoleBrief {
  id: number
  roleName: string
  roleCode: string
}

interface UserRecord {
  [key: string]: unknown
  id: number
  username: string
  nickname: string
  realName?: string
  deptId?: number
  deptName?: string
  companyId?: number
  companyName?: string
  phone?: string
  email?: string
  status: number
  domains?: DomainBrief[]
  roles?: RoleBrief[]
  createTime: string
  updateTime: string
}

interface UserFormValues {
  username: string
  nickname: string
  realName?: string
  password?: string
  deptId?: number
  phone?: string
  email?: string
  status: number
  roleIds?: number[]
}

interface DeptItem {
  id: number
  deptName: string
  children?: DeptItem[]
}

interface RoleItem {
  id: number
  roleName: string
  roleCode: string
}

const fields: FieldDefinition[] = [
  { key: 'username', label: '用户名', type: 'input', width: 160 },
  { key: 'nickname', label: '昵称', type: 'input', width: 160 },
  { key: 'realName', label: '真实姓名', type: 'input', width: 120 },
  { key: 'companyName', label: '所属公司', type: 'input', width: 140 },
  { key: 'deptName', label: '所属部门', type: 'input', width: 140 },
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]},
  { key: 'domains', label: '关联域', width: 220 },
  { key: 'roles', label: '角色', width: 180 },
  { key: 'createTime', label: '创建时间', type: 'date', width: 170 },
  { key: 'action', label: '操作', width: 200, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'username', label: '用户名', visible: true, width: 140 },
  { key: 'nickname', label: '昵称', visible: true, width: 120 },
  { key: 'realName', label: '真实姓名', visible: true, width: 120 },
  { key: 'companyName', label: '所属公司', visible: true, width: 140 },
  { key: 'deptName', label: '所属部门', visible: true, width: 140 },
  { key: 'status', label: '状态', visible: true, width: 90 },
  { key: 'domains', label: '关联域', visible: true, width: 200 },
  { key: 'roles', label: '角色', visible: true, width: 160 },
  { key: 'createTime', label: '创建时间', visible: true, width: 170 },
]

const STORAGE_KEY = 'user-management-column-settings-v2'

function buildDeptTreeData(depts: DeptItem[]): Array<{
  title: string
  value: number
  children?: ReturnType<typeof buildDeptTreeData>
}> {
  return depts.map((d) => ({
    title: d.deptName,
    value: d.id,
    children: d.children && d.children.length > 0 ? buildDeptTreeData(d.children) : undefined,
  }))
}

export default function UserManagement() {
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<UserRecord>({
    apiEndpoint: API_ENDPOINTS.SYS_USERS,
    defaultPageSize: 20,
  })

  const menuTitle = useMenuTitle()

  const { createUser, updateUser, updateUserStatus, resetPassword, fetchUserDomains, assignDomains } = useSysUsers()
  const { fetchAllDomains } = useDomains()

  const [columnFields, setColumnFields] = useState<ColumnField[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return defaultColumnFields
  })

  const [formVisible, setFormVisible] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm<UserFormValues>()
  const [deptTree, setDeptTree] = useState<DeptItem[]>([])
  const [roleList, setRoleList] = useState<RoleItem[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])

  const [domainVisible, setDomainVisible] = useState(false)
  const [domainLoading, setDomainLoading] = useState(false)
  const [domainUserId, setDomainUserId] = useState<number | null>(null)
  const [allDomains, setAllDomains] = useState<Domain[]>([])
  const [selectedDomainIds, setSelectedDomainIds] = useState<number[]>([])

  const navigate = useNavigate()

  const handleColumnSettingsConfirm = useCallback((nextFields: ColumnField[]) => {
    setColumnFields(nextFields)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFields))
    } catch { /* ignore */ }
  }, [])

  const handleColumnSettingsReset = useCallback(() => {
    setColumnFields(defaultColumnFields)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultColumnFields))
    } catch { /* ignore */ }
  }, [])

  const loadDeptAndRoles = useCallback(async () => {
    try {
      const [deptRes, roleRes] = await Promise.all([
        fetch(API_ENDPOINTS.SYS_DEPTS),
        fetch(`${API_ENDPOINTS.SYS_ROLES}/all`),
      ])
      const deptJson = await deptRes.json()
      const roleJson = await roleRes.json()
      if (deptJson.code === 200) setDeptTree(deptJson.data || [])
      if (roleJson.code === 200) setRoleList(roleJson.data || [])
    } catch { /* ignore */ }
  }, [])

  const openCreate = useCallback(async () => {
    setEditingId(null)
    setSelectedRoleIds([])
    form.resetFields()
    form.setFieldsValue({ status: 1, password: '123123' })
    setFormVisible(true)
    await loadDeptAndRoles()
  }, [form, loadDeptAndRoles])

  const openEdit = useCallback(async (record: UserRecord) => {
    setEditingId(record.id)
    setSelectedRoleIds((record.roles || []).map((r) => r.id))
    form.setFieldsValue({
      username: record.username,
      nickname: record.nickname,
      realName: record.realName,
      deptId: record.deptId,
      phone: record.phone,
      email: record.email,
      status: record.status,
      roleIds: (record.roles || []).map((r) => r.id),
    })
    setFormVisible(true)
    await loadDeptAndRoles()
  }, [form, loadDeptAndRoles])

  const handleFormSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      setFormLoading(true)
      const payload = { ...values, roleIds: values.roleIds ?? selectedRoleIds }

      if (editingId === null) {
        const newId = await createUser(payload)
        if (newId !== null) {
          CompanyMessage.success('新增成功')
          setFormVisible(false)
          refresh()
        } else {
          CompanyMessage.error('新增失败，请稍后重试')
        }
      } else {
        const ok = await updateUser(editingId, payload)
        if (ok) {
          CompanyMessage.success('编辑成功')
          setFormVisible(false)
          refresh()
        } else {
          CompanyMessage.error('编辑失败，请稍后重试')
        }
      }
    } catch {
      /* 校验失败 */
    } finally {
      setFormLoading(false)
    }
  }, [form, editingId, selectedRoleIds, createUser, updateUser, refresh])

  const handleToggleStatus = useCallback(async (record: UserRecord) => {
    const newStatus = record.status === 1 ? 0 : 1
    const ok = await updateUserStatus(record.id, newStatus)
    if (ok) {
      CompanyMessage.success(newStatus === 1 ? '已启用' : '已禁用')
      refresh()
    } else {
      CompanyMessage.error('操作失败，请稍后重试')
    }
  }, [updateUserStatus, refresh])

  const handleResetPassword = useCallback(async (record: UserRecord) => {
    const pwd = await resetPassword(record.id)
    if (pwd !== null) {
      CompanyMessage.success(`密码已重置为：${pwd}`)
    } else {
      CompanyMessage.error('重置失败，请稍后重试')
    }
  }, [resetPassword])

  const openAssignDomains = useCallback(async (record: UserRecord) => {
    setDomainUserId(record.id)
    setSelectedDomainIds([])
    setDomainVisible(true)
    const [domains, userDomains] = await Promise.all([
      fetchAllDomains(),
      fetchUserDomains(record.id),
    ])
    setAllDomains(domains)
    setSelectedDomainIds(userDomains.map((d) => d.id))
  }, [fetchAllDomains, fetchUserDomains])

  const handleAssignDomains = useCallback(async () => {
    if (domainUserId === null) return
    setDomainLoading(true)
    const ok = await assignDomains(domainUserId, selectedDomainIds)
    setDomainLoading(false)
    if (ok) {
      CompanyMessage.success('域分配已更新')
      setDomainVisible(false)
      refresh()
    } else {
      CompanyMessage.error('分配失败，请稍后重试')
    }
  }, [domainUserId, selectedDomainIds, assignDomains, refresh])

  const toolbarActions = (
    <CompanyButton type="primary" onClick={openCreate}>
      新增用户
    </CompanyButton>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const userRecord = record as unknown as UserRecord

      if (column.key === 'status') {
        return (
          <CompanyTag color={userRecord.status === 1 ? 'success' : 'default'}>
            {userRecord.status === 1 ? '启用' : '禁用'}
          </CompanyTag>
        )
      }

      if (column.key === 'domains') {
        const domains = userRecord.domains || []
        if (domains.length === 0) {
          return <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
        }
        return <span>{domains.map((d) => d.domainName).join('、')}</span>
      }

      if (column.key === 'roles') {
        const roles = userRecord.roles || []
        if (roles.length === 0) {
          return <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
        }
        return <span>{roles.map((r) => r.roleName).join('、')}</span>
      }

      if (column.key === 'companyName') {
        return <span>{userRecord.companyName || <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>}</span>
      }

      if (column.key === 'deptName') {
        return <span>{userRecord.deptName || <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>}</span>
      }

      if (column.key === 'realName') {
        return <span>{userRecord.realName || <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>}</span>
      }

      if (column.key === 'action') {
        const buttons = [
          { key: 'detail', label: '详情', onClick: () => navigate(`/user-management/${userRecord.id}`) },
          { key: 'edit', label: '编辑', onClick: () => openEdit(userRecord) },
          {
            key: 'domain',
            label: '分配域',
            onClick: () => openAssignDomains(userRecord),
          },
          {
            key: 'resetPwd',
            label: '重置密码',
            onClick: () => handleResetPassword(userRecord),
          },
          {
            key: 'toggle',
            label: userRecord.status === 1 ? '禁用' : '启用',
            onClick: () => handleToggleStatus(userRecord),
          },
        ]
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [navigate, openEdit, openAssignDomains, handleResetPassword, handleToggleStatus]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <SmartListTemplate
        title={menuTitle || '用户管理'}
        fields={fields}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        filterParams={filterParams}
        onFilterParamsChange={setFilterParams}
        onSearch={(data) => fetchData(data)}
        onReset={() => {
          setFilterParams({})
          fetchData({})
        }}
        columnFields={columnFields}
        defaultColumnFields={defaultColumnFields}
        onColumnSettingsChange={handleColumnSettingsConfirm}
        onColumnSettingsReset={handleColumnSettingsReset}
        onRefresh={refresh}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />

      <CompanyDrawer
        title={editingId === null ? '新增用户' : '编辑用户'}
        open={formVisible}
        onClose={() => setFormVisible(false)}
        size={480}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CompanyButton onClick={() => setFormVisible(false)}>取消</CompanyButton>
            <CompanyButton type="primary" loading={formLoading} onClick={handleFormSubmit}>
              确定
            </CompanyButton>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1 }}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" maxLength={50} />
          </Form.Item>
          <Form.Item name="realName" label="真实姓名">
            <Input placeholder="请输入真实姓名" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={editingId === null ? [{ required: true, message: '请输入密码' }] : []}
            extra={editingId !== null ? '留空则不修改密码' : '默认密码 123123，可修改'}
          >
            <Input.Password placeholder="请输入密码" maxLength={50} />
          </Form.Item>
          <Form.Item name="deptId" label="所属部门">
            <TreeSelect
              treeData={buildDeptTreeData(deptTree)}
              placeholder="请选择部门"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item
            name="roleIds"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择角色（可多选）"
              onChange={(values) => setSelectedRoleIds(values as number[])}
              options={roleList.map((r) => ({ label: r.roleName, value: r.id }))}
              allowClear
            />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" maxLength={20} />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" maxLength={100} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group>
              <Radio value={1}>启用</Radio>
              <Radio value={0}>禁用</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </CompanyDrawer>

      <CompanyDrawer
        title="分配域"
        open={domainVisible}
        onClose={() => setDomainVisible(false)}
        size={420}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CompanyButton onClick={() => setDomainVisible(false)}>取消</CompanyButton>
            <CompanyButton type="primary" loading={domainLoading} onClick={handleAssignDomains}>
              确定
            </CompanyButton>
          </div>
        }
      >
        {allDomains.length === 0 ? (
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>暂无可分配的域</span>
        ) : (
          <Checkbox.Group
            value={selectedDomainIds}
            onChange={(values) => setSelectedDomainIds(values as number[])}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {allDomains.map((domain) => (
                <Checkbox key={domain.id} value={domain.id}>
                  {domain.domainName}
                  <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 8 }}>
                    ({domain.domainKey})
                  </span>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        )}
      </CompanyDrawer>
    </>
  )
}
