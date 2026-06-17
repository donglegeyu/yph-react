import { useEffect, useCallback, useState } from 'react'
import { Form, Input, InputNumber, Radio, Tree, TreeSelect, Space } from 'antd'
import type { TreeDataNode } from 'antd'
import {
  ActionCell,
  CompanyButton,
  CompanyDrawer,
  CompanyMessage,
  CompanyTag,
  SmartListTemplate,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData, useMenuTitle } from '@/hooks'

interface RoleRecord {
  [key: string]: unknown
  id: number
  roleName: string
  roleCode: string
  dataScope: number
  sortOrder: number
  status: number
  remark: string
  createTime: string
}

interface NavMenuItem {
  id: number
  label: string
  menuCategory: string
  parentId: number
  children?: NavMenuItem[]
}

interface DeptItem {
  id: number
  deptName: string
  children?: DeptItem[]
}

interface RoleFormValues {
  roleName: string
  roleCode: string
  sortOrder: number
  status: number
  remark?: string
}

const dataScopeMap: Record<number, string> = {
  1: '全部数据',
  2: '自定义部门',
  3: '本部门数据',
  4: '本部门及以下',
  5: '仅本人数据',
}

const fields: FieldDefinition[] = [
  { key: 'roleName', label: '角色名称', type: 'input', width: 160 },
  { key: 'roleCode', label: '角色编码', type: 'input', width: 160 },
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
  ]},
  { key: 'action', label: '操作', width: 240, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'roleName', label: '角色名称', visible: true, width: 160 },
  { key: 'roleCode', label: '角色编码', visible: true, width: 160 },
  { key: 'dataScope', label: '数据范围', visible: true, width: 120 },
  { key: 'sortOrder', label: '排序', visible: true, width: 80 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'createTime', label: '创建时间', visible: true, width: 180 },
]

function buildMenuTreeData(menus: NavMenuItem[]): TreeDataNode[] {
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
    children: m.children && m.children.length > 0 ? buildMenuTreeData(m.children) : undefined,
  }))
}

function buildDeptTreeData(depts: DeptItem[]): TreeDataNode[] {
  return depts.map((d) => ({
    key: d.id,
    title: d.deptName,
    children: d.children && d.children.length > 0 ? buildDeptTreeData(d.children) : undefined,
  }))
}

function collectAllMenuIds(menus: NavMenuItem[]): number[] {
  const ids: number[] = []
  const walk = (list: NavMenuItem[]) => {
    list.forEach((m) => {
      ids.push(m.id)
      if (m.children) walk(m.children)
    })
  }
  walk(menus)
  return ids
}

export default function RoleManagement() {
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<RoleRecord>({
    apiEndpoint: API_ENDPOINTS.SYS_ROLES,
    defaultPageSize: 20,
  })

  const menuTitle = useMenuTitle()

  const [formVisible, setFormVisible] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm<RoleFormValues>()

  const [menuVisible, setMenuVisible] = useState(false)
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuRoleId, setMenuRoleId] = useState<number | null>(null)
  const [menuTree, setMenuTree] = useState<NavMenuItem[]>([])
  const [checkedMenuKeys, setCheckedMenuKeys] = useState<number[]>([])

  const [scopeVisible, setScopeVisible] = useState(false)
  const [scopeLoading, setScopeLoading] = useState(false)
  const [scopeRoleId, setScopeRoleId] = useState<number | null>(null)
  const [dataScope, setDataScope] = useState<number>(1)
  const [deptTree, setDeptTree] = useState<DeptItem[]>([])
  const [checkedDeptKeys, setCheckedDeptKeys] = useState<number[]>([])

  const openCreate = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ sortOrder: 0, status: 1 })
    setFormVisible(true)
  }, [form])

  const openEdit = useCallback((record: RoleRecord) => {
    setEditingId(record.id)
    form.setFieldsValue({
      roleName: record.roleName,
      roleCode: record.roleCode,
      sortOrder: record.sortOrder,
      status: record.status,
      remark: record.remark,
    })
    setFormVisible(true)
  }, [form])

  const handleFormSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      setFormLoading(true)
      const url = editingId === null
        ? API_ENDPOINTS.SYS_ROLES
        : `${API_ENDPOINTS.SYS_ROLES}/${editingId}`
      const method = editingId === null ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(editingId === null ? '新增成功' : '编辑成功')
        setFormVisible(false)
        refresh()
      } else {
        CompanyMessage.error(json.message || '操作失败')
      }
    } catch {
      /* 校验失败 */
    } finally {
      setFormLoading(false)
    }
  }, [form, editingId, refresh])

  const handleToggleStatus = useCallback(async (record: RoleRecord) => {
    const newStatus = record.status === 1 ? 0 : 1
    try {
      const res = await fetch(`${API_ENDPOINTS.SYS_ROLES}/${record.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(newStatus === 1 ? '已启用' : '已停用')
        refresh()
      }
    } catch {
      CompanyMessage.error('操作失败')
    }
  }, [refresh])

  const handleDelete = useCallback(async (record: RoleRecord) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.SYS_ROLES}/${record.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('删除成功')
        refresh()
      } else {
        CompanyMessage.error(json.message || '删除失败')
      }
    } catch {
      CompanyMessage.error('删除失败')
    }
  }, [refresh])

  const openMenuPermission = useCallback(async (record: RoleRecord) => {
    setMenuRoleId(record.id)
    setCheckedMenuKeys([])
    setMenuVisible(true)
    try {
      const [menuRes, checkedRes] = await Promise.all([
        fetch(API_ENDPOINTS.NAV_MENUS),
        fetch(`${API_ENDPOINTS.SYS_ROLES}/${record.id}/menus`),
      ])
      const menuJson = await menuRes.json()
      const checkedJson = await checkedRes.json()
      setMenuTree(menuJson.data || [])
      setCheckedMenuKeys((checkedJson.data || []).map((id: number) => id))
    } catch {
      CompanyMessage.error('加载菜单数据失败')
    }
  }, [])

  const handleMenuSubmit = useCallback(async () => {
    if (menuRoleId === null) return
    setMenuLoading(true)
    try {
      const res = await fetch(`${API_ENDPOINTS.SYS_ROLES}/${menuRoleId}/menus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuIds: checkedMenuKeys }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('菜单权限已保存')
        setMenuVisible(false)
      } else {
        CompanyMessage.error('保存失败')
      }
    } finally {
      setMenuLoading(false)
    }
  }, [menuRoleId, checkedMenuKeys])

  const openDataScope = useCallback(async (record: RoleRecord) => {
    setScopeRoleId(record.id)
    setDataScope(record.dataScope)
    setCheckedDeptKeys([])
    setScopeVisible(true)
    try {
      const [deptRes, checkedRes] = await Promise.all([
        fetch(API_ENDPOINTS.SYS_DEPTS),
        fetch(`${API_ENDPOINTS.SYS_ROLES}/${record.id}/data-scope`),
      ])
      const deptJson = await deptRes.json()
      const checkedJson = await checkedRes.json()
      setDeptTree(deptJson.data || [])
      setCheckedDeptKeys((checkedJson.data || []).map((id: number) => id))
    } catch {
      CompanyMessage.error('加载部门数据失败')
    }
  }, [])

  const handleScopeSubmit = useCallback(async () => {
    if (scopeRoleId === null) return
    setScopeLoading(true)
    try {
      const res = await fetch(`${API_ENDPOINTS.SYS_ROLES}/${scopeRoleId}/data-scope`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataScope, deptIds: checkedDeptKeys }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('数据权限已保存')
        setScopeVisible(false)
        refresh()
      } else {
        CompanyMessage.error('保存失败')
      }
    } finally {
      setScopeLoading(false)
    }
  }, [scopeRoleId, dataScope, checkedDeptKeys, refresh])

  const toolbarActions = (
    <CompanyButton type="primary" onClick={openCreate}>
      新增角色
    </CompanyButton>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const roleRecord = record as unknown as RoleRecord

      if (column.key === 'status') {
        return (
          <CompanyTag color={roleRecord.status === 1 ? 'success' : 'default'}>
            {roleRecord.status === 1 ? '启用' : '停用'}
          </CompanyTag>
        )
      }

      if (column.key === 'dataScope') {
        return <span>{dataScopeMap[roleRecord.dataScope] || '未知'}</span>
      }

      if (column.key === 'action') {
        const buttons = [
          { key: 'edit', label: '编辑', onClick: () => openEdit(roleRecord) },
          { key: 'menu', label: '菜单权限', onClick: () => openMenuPermission(roleRecord) },
          { key: 'scope', label: '数据权限', onClick: () => openDataScope(roleRecord) },
          {
            key: 'toggle',
            label: roleRecord.status === 1 ? '停用' : '启用',
            onClick: () => handleToggleStatus(roleRecord),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            confirm: true,
            confirmTitle: '确定删除该角色？',
            onClick: () => handleDelete(roleRecord),
          },
        ]
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [openEdit, openMenuPermission, openDataScope, handleToggleStatus, handleDelete]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <SmartListTemplate
        title={menuTitle || '角色管理'}
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
        columnFields={defaultColumnFields}
        defaultColumnFields={defaultColumnFields}
        onRefresh={refresh}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />

      <CompanyDrawer
        title={editingId === null ? '新增角色' : '编辑角色'}
        open={formVisible}
        onClose={() => setFormVisible(false)}
        size={420}
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
        <Form form={form} layout="vertical">
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="如：销售专员" maxLength={50} />
          </Form.Item>
          <Form.Item name="roleCode" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input placeholder="如：ROLE_SALES" maxLength={50} />
          </Form.Item>
          <Form.Item name="sortOrder" label="显示顺序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group>
              <Radio value={1}>启用</Radio>
              <Radio value={0}>停用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} maxLength={200} placeholder="角色说明" />
          </Form.Item>
        </Form>
      </CompanyDrawer>

      <CompanyDrawer
        title="菜单权限分配"
        open={menuVisible}
        onClose={() => setMenuVisible(false)}
        size={420}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <CompanyButton
                size="small"
                onClick={() => setCheckedMenuKeys(collectAllMenuIds(menuTree))}
              >
                全选
              </CompanyButton>
              <CompanyButton size="small" onClick={() => setCheckedMenuKeys([])}>
                清空
              </CompanyButton>
            </Space>
            <Space>
              <CompanyButton onClick={() => setMenuVisible(false)}>取消</CompanyButton>
              <CompanyButton type="primary" loading={menuLoading} onClick={handleMenuSubmit}>
                保存
              </CompanyButton>
            </Space>
          </div>
        }
      >
        <Tree
          checkable
          defaultExpandAll
          treeData={buildMenuTreeData(menuTree)}
          checkedKeys={{ checked: checkedMenuKeys, halfChecked: [] }}
          onCheck={(checked) => {
            const keys = Array.isArray(checked) ? checked : (checked as { checked: React.Key[] }).checked
            setCheckedMenuKeys(keys.map(Number))
          }}
        />
      </CompanyDrawer>

      <CompanyDrawer
        title="数据权限设置"
        open={scopeVisible}
        onClose={() => setScopeVisible(false)}
        size={420}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CompanyButton onClick={() => setScopeVisible(false)}>取消</CompanyButton>
            <CompanyButton type="primary" loading={scopeLoading} onClick={handleScopeSubmit}>
              保存
            </CompanyButton>
          </div>
        }
      >
        <Form layout="vertical">
          <Form.Item label="数据范围">
            <Radio.Group
              value={dataScope}
              onChange={(e) => setDataScope(e.target.value)}
            >
              <Space direction="vertical">
                <Radio value={1}>全部数据</Radio>
                <Radio value={2}>自定义部门</Radio>
                <Radio value={3}>本部门数据</Radio>
                <Radio value={4}>本部门及以下数据</Radio>
                <Radio value={5}>仅本人数据</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          {dataScope === 2 && (
            <Form.Item label="选择部门（可多选）">
              <TreeSelect
                treeData={buildDeptTreeData(deptTree)}
                value={checkedDeptKeys}
                onChange={(values) => setCheckedDeptKeys(values.map(Number))}
                treeCheckable
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                placeholder="请选择可见的部门"
                treeDefaultExpandAll
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
        </Form>
      </CompanyDrawer>
    </>
  )
}
