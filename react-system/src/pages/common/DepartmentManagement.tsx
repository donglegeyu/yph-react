import { useEffect, useCallback, useState } from 'react'
import { Form, Input, InputNumber, Radio, TreeSelect } from 'antd'
import {
  ActionCell,
  CompanyButton,
  CompanyDrawer,
  CompanyMessage,
  CompanyTag,
  SmartListTemplate,
  type ColumnField,
  type FieldDefinition,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useMenuTitle } from '@/hooks'

interface DeptRecord {
  id: number
  parentId: number
  ancestors: string
  deptName: string
  deptCode: string
  sortOrder: number
  leaderUserId: number | null
  status: number
  userCount?: number
  children?: DeptRecord[]
}

interface DeptFormValues {
  parentId: number
  deptName: string
  deptCode: string
  sortOrder: number
  status: number
}

type TreeSelectNode = {
  title: string
  value: number
  disabled: boolean
  children?: TreeSelectNode[]
}

function buildTreeSelectData(list: DeptRecord[], disabledId?: number): TreeSelectNode[] {
  const loop = (nodes: DeptRecord[]): TreeSelectNode[] =>
    nodes.map((n) => ({
      title: n.deptName,
      value: n.id,
      disabled: n.id === disabledId,
      children: n.children ? loop(n.children) : undefined,
    }))
  return [
    { title: '顶级部门', value: 0, disabled: false, children: loop(list) },
  ]
}

const fields: FieldDefinition[] = [
  { key: 'deptName', label: '部门名称', type: 'input', width: 220 },
  { key: 'deptCode', label: '部门编码', type: 'input', width: 160 },
  { key: 'sortOrder', label: '排序', type: 'input', width: 80 },
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
  ]},
  { key: 'userCount', label: '用户数', type: 'input', width: 90 },
  { key: 'action', label: '操作', width: 260, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'deptName', label: '部门名称', visible: true, width: 220 },
  { key: 'deptCode', label: '部门编码', visible: true, width: 160 },
  { key: 'sortOrder', label: '排序', visible: true, width: 80 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'userCount', label: '用户数', visible: true, width: 90 },
]

const STORAGE_KEY = 'department-management-column-settings'

export default function DepartmentManagement() {
  const menuTitle = useMenuTitle()
  const [loading, setLoading] = useState(false)
  const [treeData, setTreeData] = useState<DeptRecord[]>([])
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm<DeptFormValues>()

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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API_ENDPOINTS.SYS_DEPTS)
      const json = await res.json()
      if (json.code === 200) {
        setTreeData(json.data || [])
      }
    } catch {
      CompanyMessage.error('加载部门数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const openCreate = useCallback((parentId = 0) => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ parentId, sortOrder: 0, status: 1 })
    setDrawerVisible(true)
  }, [form])

  const openEdit = useCallback((record: DeptRecord) => {
    setEditingId(record.id)
    form.setFieldsValue({
      parentId: record.parentId,
      deptName: record.deptName,
      deptCode: record.deptCode,
      sortOrder: record.sortOrder,
      status: record.status,
    })
    setDrawerVisible(true)
  }, [form])

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const url = editingId === null
        ? API_ENDPOINTS.SYS_DEPTS
        : `${API_ENDPOINTS.SYS_DEPTS}/${editingId}`
      const method = editingId === null ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(editingId === null ? '新增成功' : '编辑成功')
        setDrawerVisible(false)
        fetchData()
      } else {
        CompanyMessage.error(json.message || '操作失败')
      }
    } catch {
      /* 校验失败 */
    } finally {
      setSubmitting(false)
    }
  }, [form, editingId, fetchData])

  const handleToggleStatus = useCallback(async (record: DeptRecord) => {
    const newStatus = record.status === 1 ? 0 : 1
    try {
      const res = await fetch(`${API_ENDPOINTS.SYS_DEPTS}/${record.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(newStatus === 1 ? '已启用' : '已停用')
        fetchData()
      } else {
        CompanyMessage.error(json.message || '操作失败')
      }
    } catch {
      CompanyMessage.error('操作失败')
    }
  }, [fetchData])

  const handleDelete = useCallback(async (record: DeptRecord) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.SYS_DEPTS}/${record.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('删除成功')
        fetchData()
      } else {
        CompanyMessage.error(json.message || '删除失败')
      }
    } catch {
      CompanyMessage.error('删除失败')
    }
  }, [fetchData])

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [])

  const toolbarActions = (
    <CompanyButton type="primary" onClick={() => openCreate(0)}>
      新增部门
    </CompanyButton>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const item = record as unknown as DeptRecord

      if (column.key === 'status') {
        return (
          <CompanyTag color={item.status === 1 ? 'success' : 'default'}>
            {item.status === 1 ? '启用' : '停用'}
          </CompanyTag>
        )
      }

      if (column.key === 'userCount') {
        return <>{item.userCount || 0} 人</>
      }

      if (column.key === 'action') {
        return (
          <ActionCell
            buttons={[
              { key: 'addChild', label: '新增子级', onClick: () => openCreate(item.id) },
              { key: 'edit', label: '编辑', onClick: () => openEdit(item) },
              {
                key: 'toggle',
                label: item.status === 1 ? '停用' : '启用',
                onClick: () => handleToggleStatus(item),
              },
              {
                key: 'delete',
                label: '删除',
                danger: true,
                confirm: true,
                confirmTitle: `确定删除部门「${item.deptName}」？`,
                onClick: () => handleDelete(item),
              },
            ]}
          />
        )
      }

      return null
    },
    [openCreate, openEdit, handleToggleStatus, handleDelete]
  )

  return (
    <>
      <SmartListTemplate
        title={menuTitle || '部门管理'}
        fields={fields}
        dataSource={treeData as unknown as Record<string, unknown>[]}
        loading={loading}
        pagination={false}
        rowKey="id"
        treeConfig={{ enabled: true, levelIndent: 24 }}
        defaultExpandAll
        columnFields={columnFields}
        defaultColumnFields={defaultColumnFields}
        onColumnSettingsChange={handleColumnSettingsConfirm}
        onColumnSettingsReset={handleColumnSettingsReset}
        onRefresh={fetchData}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />

      <CompanyDrawer
        title={editingId === null ? '新增部门' : '编辑部门'}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size={420}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CompanyButton onClick={() => setDrawerVisible(false)}>取消</CompanyButton>
            <CompanyButton type="primary" loading={submitting} onClick={handleSubmit}>
              确定
            </CompanyButton>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="parentId" label="上级部门" rules={[{ required: true }]}>
            <TreeSelect
              treeData={buildTreeSelectData(treeData, editingId || undefined)}
              placeholder="请选择上级部门"
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item
            name="deptName"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="deptCode"
            label="部门编码"
            rules={[{ required: true, message: '请输入部门编码' }]}
          >
            <Input placeholder="请输入部门编码（唯一）" maxLength={50} />
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
        </Form>
      </CompanyDrawer>
    </>
  )
}
