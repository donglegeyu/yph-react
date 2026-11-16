import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActionCell,
  CompanyButton,
  CompanyDrawer,
  CompanyForm,
  CompanyInput,
  CompanyMessage,
  CompanySelect,
  CompanySwitch,
  CompanyTag,
  SmartListTemplate,
} from '@donglegeyu/company-ui'
import type { ColumnField, FieldDefinition } from '@donglegeyu/company-ui'
import {
  fetchBusinessBindings,
  fetchProcessDesigns,
  fetchRegisteredBusinessTypes,
  fmtTime,
  saveBusinessBinding,
  toggleBusinessBinding,
  type BusinessBindingItem,
  type ProcessDesignItem,
} from './api'

const fields: FieldDefinition[] = [
  { key: 'businessName', label: '业务名称', type: 'item', hideInFilter: true },
  { key: 'businessType', label: '业务类型', type: 'item', hideInFilter: true },
  { key: 'processKey', label: '绑定流程', type: 'item', hideInFilter: true },
  { key: 'approvalMode', label: '审批模式', type: 'item', width: 110, hideInFilter: true },
  { key: 'enabled', label: '状态', type: 'item', width: 100, hideInFilter: true },
  { key: 'updateTime', label: '更新时间', type: 'item', width: 170, hideInFilter: true },
  { key: 'action', label: '操作', type: 'item', width: 140, fixed: 'right', hideInFilter: true },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'businessName', label: '业务名称', visible: true },
  { key: 'businessType', label: '业务类型', visible: true },
  { key: 'processKey', label: '绑定流程', visible: true },
  { key: 'approvalMode', label: '审批模式', visible: true, width: 110 },
  { key: 'enabled', label: '状态', visible: true, width: 100 },
  { key: 'updateTime', label: '更新时间', visible: true, width: 170 },
]

interface BusinessTypeOption {
  value: string
  label: string
}

interface EditState {
  open: boolean
  /** 编辑时锁定业务类型（businessType 是绑定主键，不允许改） */
  record: BusinessBindingItem | null
}

export default function BusinessBindingAdmin() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<BusinessBindingItem[]>([])
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeOption[]>([])
  const [designs, setDesigns] = useState<ProcessDesignItem[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [edit, setEdit] = useState<EditState>({ open: false, record: null })
  const [saving, setSaving] = useState(false)
  const [form] = CompanyForm.useForm()

  useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const [bindingRes, typeRes, designRes] = await Promise.all([
          fetchBusinessBindings(),
          fetchRegisteredBusinessTypes(),
          fetchProcessDesigns(),
        ])
        if (ignore) return
        if (bindingRes.code === 200 && bindingRes.data) {
          setRecords(bindingRes.data)
        } else {
          CompanyMessage.error(bindingRes.message || '绑定列表加载失败')
        }
        if (typeRes.code === 200 && typeRes.data) setBusinessTypes(typeRes.data)
        if (designRes.code === 200 && designRes.data) setDesigns(designRes.data)
      } catch {
        if (!ignore) CompanyMessage.error('绑定列表加载失败')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [refreshKey])

  /** 事件路径刷新：亮 loading 并触发 effect 重新拉取 */
  const reload = useCallback(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }, [])

  /** 已发布流程定义 key 集合，用于绑定流程下拉 */
  const publishedKeys = useMemo(() => new Set(designs.map((d) => d.processKey)), [designs])

  const openEdit = (record: BusinessBindingItem | null) => {
    setEdit({ open: true, record })
    form.setFieldsValue({
      businessType: record?.businessType,
      businessName: record?.businessName,
      processKey: record?.processKey ?? undefined,
      approvalMode: record?.approvalMode ?? 'required',
      enabled: record?.enabled ?? true,
      remark: record?.remark ?? undefined,
    })
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const res = await saveBusinessBinding({
        businessType: values.businessType,
        businessName: values.businessName,
        processKey: values.processKey || null,
        approvalMode: values.approvalMode,
        enabled: values.enabled,
        remark: values.remark || null,
      })
      if (res.code === 200) {
        CompanyMessage.success('保存成功')
        setEdit({ open: false, record: null })
        reload()
      } else {
        CompanyMessage.error(res.message || '保存失败')
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      const message = error instanceof Error && error.message ? error.message : '保存失败'
      CompanyMessage.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (record: BusinessBindingItem) => {
    try {
      const res = await toggleBusinessBinding(record.id, !record.enabled)
      if (res.code === 200) {
        CompanyMessage.success(record.enabled ? '已停用' : '已启用')
        reload()
      } else {
        CompanyMessage.error(res.message || '操作失败')
      }
    } catch {
      CompanyMessage.error('操作失败')
    }
  }

  return (
    <>
      <SmartListTemplate
        title="业务流程配置"
        fields={fields}
        defaultColumnFields={defaultColumnFields}
        dataSource={records as unknown as Record<string, unknown>[]}
        loading={loading}
        pagination={false}
        rowKey="id"
        onRefresh={() => reload()}
        titleRightActions={
          <CompanyButton type="primary" onClick={() => openEdit(null)}>
            新增绑定
          </CompanyButton>
        }
        bodyCell={(column, record) => {
          if (column.key === 'businessType') return <code>{record.businessType as string}</code>
          if (column.key === 'processKey') {
            const key = record.processKey as string | null
            if (!key) return <CompanyTag color="warning">未绑定</CompanyTag>
            return (
              <>
                <code>{key}</code>
                {!publishedKeys.has(key) && (
                  <CompanyTag color="error" style={{ marginLeft: 6 }}>
                    流程未发布
                  </CompanyTag>
                )}
              </>
            )
          }
          if (column.key === 'approvalMode') {
            return (record.approvalMode as string) === 'required' ? (
              <CompanyTag color="processing">必审</CompanyTag>
            ) : (
              <CompanyTag>可免审</CompanyTag>
            )
          }
          if (column.key === 'enabled') {
            return (record.enabled as boolean) ? (
              <CompanyTag color="success">已启用</CompanyTag>
            ) : (
              <CompanyTag color="warning">已停用</CompanyTag>
            )
          }
          if (column.key === 'updateTime') return <>{fmtTime(record.updateTime as string)}</>
          if (column.key === 'action') {
            const item = record as unknown as BusinessBindingItem
            return (
              <ActionCell
                maxVisible={2}
                buttons={[
                  {
                    key: 'edit',
                    label: '编辑',
                    onClick: () => openEdit(item),
                  },
                  {
                    key: 'toggle',
                    label: item.enabled ? '停用' : '启用',
                    confirm: true,
                    confirmTitle: item.enabled
                      ? `确认停用「${item.businessName}」的流程绑定？停用后按免审规则处理`
                      : `确认启用「${item.businessName}」的流程绑定？`,
                    onClick: () => void handleToggle(item),
                  },
                ]}
              />
            )
          }
          return null
        }}
      />
      <CompanyDrawer
        title={edit.record ? `编辑绑定：${edit.record.businessName}` : '新增绑定'}
        open={edit.open}
        onClose={() => setEdit({ open: false, record: null })}
        width={520}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <CompanyButton onClick={() => setEdit({ open: false, record: null })}>取消</CompanyButton>
            <CompanyButton type="primary" loading={saving} onClick={() => void handleSave()}>
              保存
            </CompanyButton>
          </div>
        }
      >
        <CompanyForm form={form} layout="vertical">
          <CompanyForm.Item
            name="businessType"
            label="业务类型"
            rules={[{ required: true, message: '请选择业务类型' }]}
            extra={
              edit.record
                ? '业务类型是绑定主键，编辑时不可修改'
                : '仅列出主服务已注册回调处理器的业务类型'
            }
          >
            <CompanySelect
              placeholder="请选择业务类型"
              disabled={edit.record !== null}
              options={businessTypes}
            />
          </CompanyForm.Item>
          <CompanyForm.Item
            name="businessName"
            label="业务名称"
            rules={[{ required: true, message: '请输入业务名称' }]}
          >
            <CompanyInput placeholder="如：工匠申请" maxLength={128} />
          </CompanyForm.Item>
          <CompanyForm.Item
            name="processKey"
            label="绑定流程"
            extra="留空表示未绑定；对应流程定义中的流程标识，流程需已发布且未停用才能正常走审批"
          >
            <CompanySelect
              placeholder="请选择已发布的流程（可留空）"
              allowClear
              options={designs.map((design) => ({ value: design.processKey, label: `${design.name}（${design.processKey}）` }))}
            />
          </CompanyForm.Item>
          <CompanyForm.Item name="approvalMode" label="审批模式" rules={[{ required: true }]}>
            <CompanySelect
              options={[
                { value: 'required', label: '必审：绑定未就绪时提交报错' },
                { value: 'optional', label: '可免审：绑定未就绪时提交即通过' },
              ]}
            />
          </CompanyForm.Item>
          <CompanyForm.Item name="enabled" label="启用状态" valuePropName="checked" extra="停用后按免审规则处理">
            <CompanySwitch checkedChildren="启用" unCheckedChildren="停用" />
          </CompanyForm.Item>
          <CompanyForm.Item name="remark" label="备注">
            <CompanyInput.TextArea placeholder="选填" rows={2} maxLength={255} />
          </CompanyForm.Item>
        </CompanyForm>
      </CompanyDrawer>
    </>
  )
}
