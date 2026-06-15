import { useEffect, useCallback, useState } from 'react'
import { Table, Form, Input, InputNumber, Radio, TreeSelect, Space } from 'antd'
import type { TableProps } from 'antd'
import {
  CompanyButton,
  CompanyDrawer,
  CompanyMessage,
  CompanyTag,
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

function flattenToTreeData(list: DeptRecord[]): DeptRecord[] {
  return list
}

function buildTreeSelectData(list: DeptRecord[], disabledId?: number) {
  const loop = (nodes: DeptRecord[]): Array<{
    title: string
    value: number
    disabled: boolean
    children?: ReturnType<typeof loop>
  }> =>
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

export default function DepartmentManagement() {
  const menuTitle = useMenuTitle()
  const [loading, setLoading] = useState(false)
  const [treeData, setTreeData] = useState<DeptRecord[]>([])
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm<DeptFormValues>()

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns: TableProps<DeptRecord>['columns'] = [
    { title: '部门名称', dataIndex: 'deptName', key: 'deptName', width: 220 },
    { title: '部门编码', dataIndex: 'deptCode', key: 'deptCode', width: 160 },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: DeptRecord) => (
        <CompanyTag color={record.status === 1 ? 'success' : 'default'}>
          {record.status === 1 ? '启用' : '停用'}
        </CompanyTag>
      ),
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 90,
      render: (v: unknown) => `${v || 0} 人`,
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: unknown, record: DeptRecord) => (
        <Space size={4}>
          <CompanyButton size="small" type="link" onClick={() => openCreate(record.id)}>
            新增子级
          </CompanyButton>
          <CompanyButton size="small" type="link" onClick={() => openEdit(record)}>
            编辑
          </CompanyButton>
          <CompanyButton size="small" type="link" onClick={() => handleToggleStatus(record)}>
            {record.status === 1 ? '停用' : '启用'}
          </CompanyButton>
          <CompanyButton size="small" type="link" danger onClick={() => handleDelete(record)}>
            删除
          </CompanyButton>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 16, background: '#fff', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{menuTitle || '部门管理'}</h2>
        <CompanyButton type="primary" onClick={() => openCreate(0)}>
          新增部门
        </CompanyButton>
      </div>

      <Table<DeptRecord>
        columns={columns}
        dataSource={flattenToTreeData(treeData)}
        rowKey="id"
        loading={loading}
        pagination={false}
        childrenColumnName="children"
        defaultExpandAllRows
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
    </div>
  )
}
