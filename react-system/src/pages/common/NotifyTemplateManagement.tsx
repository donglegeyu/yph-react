import { useCallback, useEffect, useState } from 'react'
import { Form, Input, Radio, Select } from 'antd'
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
import { del, get, post, put } from '@/utils/request'

interface NotifyTemplateRecord {
  [key: string]: unknown
  id: number
  code: string
  name: string
  type: number
  content: string
  status: number
  remark: string | null
  createTime: string
}

interface SysUserOption {
  id: number
  username: string
  nickname?: string
}

interface TemplateOption {
  id: number
  code: string
  name: string
}

interface TemplateFormValues {
  code: string
  name: string
  type: number
  content: string
  status: number
  remark?: string
}

const typeMap: Record<number, string> = { 1: '通知', 2: '公告' }

const fields: FieldDefinition[] = [
  { key: 'code', label: '模板编码', type: 'input', width: 160 },
  { key: 'name', label: '模板名称', type: 'input', width: 160 },
  { key: 'type', label: '类型', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '通知', value: 1 },
    { label: '公告', value: 2 },
  ]},
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
  ]},
  { key: 'content', label: '模板内容', type: 'item', hideInFilter: true },
  { key: 'createTime', label: '创建时间', type: 'item', width: 170, hideInFilter: true },
  { key: 'action', label: '操作', type: 'item', width: 200, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'code', label: '模板编码', visible: true, width: 180 },
  { key: 'name', label: '模板名称', visible: true, width: 160 },
  { key: 'type', label: '类型', visible: true, width: 90 },
  { key: 'content', label: '模板内容', visible: true },
  { key: 'status', label: '状态', visible: true, width: 90 },
  { key: 'createTime', label: '创建时间', visible: true, width: 170 },
]

export default function NotifyTemplateManagement() {
  const menuTitle = useMenuTitle()

  /** 手写分页状态（不走 useListData：其翻页读闭包旧值，且原生 fetch 不带 token） */
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<NotifyTemplateRecord[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(20)
  const [filterParams, setFilterParams] = useState<Record<string, unknown>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const reload = useCallback(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }, [])

  useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const params: Record<string, unknown> = { current, size, ...filterParams }
        Object.keys(params).forEach((k) => {
          if (params[k] === '' || params[k] == null) delete params[k]
        })
        const res = await get<{ records: NotifyTemplateRecord[]; total: number }>(
          API_ENDPOINTS.NOTIFY_TEMPLATES,
          params,
        )
        if (ignore) return
        if (res.code === 200 && res.data) {
          setDataSource(res.data.records || [])
          setTotal(res.data.total || 0)
        } else {
          CompanyMessage.error(res.message || '模板列表加载失败')
        }
      } catch {
        if (!ignore) CompanyMessage.error('模板列表加载失败')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [current, size, filterParams, refreshKey])

  const [formVisible, setFormVisible] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm<TemplateFormValues>()

  // 发送抽屉
  const [sendVisible, setSendVisible] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([])
  const [userOptions, setUserOptions] = useState<SysUserOption[]>([])
  const [sendTemplateCode, setSendTemplateCode] = useState<string | undefined>(undefined)
  const [sendUserIds, setSendUserIds] = useState<number[]>([])
  const [sendParams, setSendParams] = useState('')

  const openCreate = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ type: 1, status: 1 })
    setFormVisible(true)
  }, [form])

  const openEdit = useCallback(
    (record: NotifyTemplateRecord) => {
      setEditingId(record.id)
      form.setFieldsValue({
        code: record.code,
        name: record.name,
        type: record.type,
        content: record.content,
        status: record.status,
        remark: record.remark ?? undefined,
      })
      setFormVisible(true)
    },
    [form],
  )

  const handleFormSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      setFormLoading(true)
      const res =
        editingId === null
          ? await post(API_ENDPOINTS.NOTIFY_TEMPLATES, values)
          : await put(`${API_ENDPOINTS.NOTIFY_TEMPLATES}/${editingId}`, values)
      if (res.code === 200) {
        CompanyMessage.success(editingId === null ? '新增成功' : '编辑成功')
        setFormVisible(false)
        reload()
      } else {
        CompanyMessage.error(res.message || '操作失败')
      }
    } catch {
      /* 校验失败 */
    } finally {
      setFormLoading(false)
    }
  }, [form, editingId, reload])

  const handleToggleStatus = useCallback(
    async (record: NotifyTemplateRecord) => {
      const newStatus = record.status === 1 ? 0 : 1
      try {
        const res = await put(`${API_ENDPOINTS.NOTIFY_TEMPLATES}/${record.id}`, {
          ...record,
          status: newStatus,
        })
        if (res.code === 200) {
          CompanyMessage.success(newStatus === 1 ? '已启用' : '已停用')
          reload()
        } else {
          CompanyMessage.error(res.message || '操作失败')
        }
      } catch {
        CompanyMessage.error('操作失败')
      }
    },
    [reload],
  )

  const handleDelete = useCallback(
    async (record: NotifyTemplateRecord) => {
      try {
        const res = await del(`${API_ENDPOINTS.NOTIFY_TEMPLATES}/${record.id}`)
        if (res.code === 200) {
          CompanyMessage.success('删除成功')
          reload()
        } else {
          CompanyMessage.error(res.message || '删除失败')
        }
      } catch {
        CompanyMessage.error('删除失败')
      }
    },
    [reload],
  )

  // 打开发送抽屉：拉启用模板 + 用户列表
  const openSend = useCallback(async () => {
    setSendVisible(true)
    setSendTemplateCode(undefined)
    setSendUserIds([])
    setSendParams('')
    try {
      const [tplRes, userRes] = await Promise.all([
        get<{ records: NotifyTemplateRecord[] }>(API_ENDPOINTS.NOTIFY_TEMPLATES, { current: 1, size: 100, status: 1 }),
        get<{ records: SysUserOption[] }>(API_ENDPOINTS.SYS_USERS, { current: 1, size: 200 }),
      ])
      if (tplRes.code === 200) {
        setTemplateOptions((tplRes.data?.records || []).map((t) => ({ id: t.id, code: t.code, name: t.name })))
      }
      if (userRes.code === 200) {
        setUserOptions(userRes.data?.records || [])
      }
    } catch {
      CompanyMessage.error('加载数据失败')
    }
  }, [])

  const handleSend = useCallback(async () => {
    if (!sendTemplateCode) {
      CompanyMessage.warning('请选择消息模板')
      return
    }
    if (sendUserIds.length === 0) {
      CompanyMessage.warning('请选择接收用户')
      return
    }
    let params: Record<string, unknown> = {}
    if (sendParams.trim()) {
      try {
        params = JSON.parse(sendParams)
      } catch {
        CompanyMessage.error('模板参数必须是合法 JSON，如 {"content":"xx"}')
        return
      }
    }
    setSendLoading(true)
    try {
      const res = await post(API_ENDPOINTS.NOTIFY_MESSAGES_SEND, {
        templateCode: sendTemplateCode,
        userIds: sendUserIds,
        params,
      })
      if (res.code === 200) {
        CompanyMessage.success('发送成功')
        setSendVisible(false)
      } else {
        CompanyMessage.error(res.message || '发送失败')
      }
    } catch {
      CompanyMessage.error('发送失败')
    } finally {
      setSendLoading(false)
    }
  }, [sendTemplateCode, sendUserIds, sendParams])

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const tpl = record as unknown as NotifyTemplateRecord

      if (column.key === 'type') {
        return <CompanyTag color="processing">{typeMap[tpl.type] || '未知'}</CompanyTag>
      }

      if (column.key === 'status') {
        return (
          <CompanyTag color={tpl.status === 1 ? 'success' : 'default'}>
            {tpl.status === 1 ? '启用' : '停用'}
          </CompanyTag>
        )
      }

      if (column.key === 'content') {
        return <span>{tpl.content || '-'}</span>
      }

      if (column.key === 'createTime') {
        return <span>{tpl.createTime ? String(tpl.createTime).replace('T', ' ').slice(0, 19) : '-'}</span>
      }

      if (column.key === 'action') {
        const buttons = [
          { key: 'edit', label: '编辑', onClick: () => openEdit(tpl) },
          {
            key: 'toggle',
            label: tpl.status === 1 ? '停用' : '启用',
            onClick: () => handleToggleStatus(tpl),
          },
          {
            key: 'delete',
            label: '删除',
            confirm: true,
            confirmTitle: '确定删除该模板？',
            onClick: () => handleDelete(tpl),
          },
        ]
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [openEdit, handleToggleStatus, handleDelete],
  )

  const toolbarActions = (
    <>
      <CompanyButton onClick={openSend}>发送消息</CompanyButton>
      <CompanyButton type="primary" onClick={openCreate}>
        新增模板
      </CompanyButton>
    </>
  )

  return (
    <>
      <SmartListTemplate
        title={menuTitle || '消息模板'}
        fields={fields}
        dataSource={dataSource as unknown as Record<string, unknown>[]}
        loading={loading}
        pagination={{ current, pageSize: size, total }}
        onSearch={(data) => {
          setLoading(true)
          setCurrent(1)
          setFilterParams(data as Record<string, unknown>)
        }}
        onReset={() => {
          setLoading(true)
          setCurrent(1)
          setFilterParams({})
        }}
        onPaginationChange={({ current: page, pageSize }) => {
          setLoading(true)
          setCurrent(page)
          setSize(pageSize)
        }}
        columnFields={defaultColumnFields}
        defaultColumnFields={defaultColumnFields}
        onRefresh={reload}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />

      <CompanyDrawer
        title={editingId === null ? '新增模板' : '编辑模板'}
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
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="模板编码"
            rules={[{ required: true, message: '请输入' }]}
            extra="全局唯一，如 order_shipped"
          >
            <Input placeholder="请输入" maxLength={64} />
          </Form.Item>
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入' }]}>
            <Input placeholder="请输入" maxLength={100} />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Radio.Group>
              <Radio value={1}>通知</Radio>
              <Radio value={2}>公告</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="content"
            label="模板内容"
            rules={[{ required: true, message: '请输入' }]}
            extra="支持 {paramName} 占位符，发送时按参数渲染"
          >
            <Input.TextArea rows={4} maxLength={500} placeholder="如：您的订单 {orderNo} 已发货" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group>
              <Radio value={1}>启用</Radio>
              <Radio value={0}>停用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} maxLength={200} placeholder="模板说明" />
          </Form.Item>
        </Form>
      </CompanyDrawer>

      <CompanyDrawer
        title="发送消息"
        open={sendVisible}
        onClose={() => setSendVisible(false)}
        size={480}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CompanyButton onClick={() => setSendVisible(false)}>取消</CompanyButton>
            <CompanyButton type="primary" loading={sendLoading} onClick={handleSend}>
              发送
            </CompanyButton>
          </div>
        }
      >
        <Form layout="vertical">
          <Form.Item label="消息模板" required>
            <Select
              placeholder="请选择"
              style={{ width: '100%' }}
              value={sendTemplateCode}
              onChange={setSendTemplateCode}
              options={templateOptions.map((t) => ({ label: `${t.name}（${t.code}）`, value: t.code }))}
            />
          </Form.Item>
          <Form.Item label="接收用户" required extra="可多选，仅站内信">
            <Select
              mode="multiple"
              placeholder="请选择"
              style={{ width: '100%' }}
              value={sendUserIds}
              onChange={setSendUserIds}
              options={userOptions.map((u) => ({
                label: u.nickname ? `${u.nickname}（${u.username}）` : u.username,
                value: u.id,
              }))}
              optionFilterProp="label"
              showSearch
            />
          </Form.Item>
          <Form.Item label="模板参数（JSON）" extra="对应模板中的 {paramName} 占位符，如 {&quot;content&quot;:&quot;十一放假通知&quot;}">
            <Input.TextArea
              rows={3}
              value={sendParams}
              onChange={(e) => setSendParams(e.target.value)}
              placeholder='{"content":"十一放假通知"}'
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </CompanyDrawer>
    </>
  )
}
