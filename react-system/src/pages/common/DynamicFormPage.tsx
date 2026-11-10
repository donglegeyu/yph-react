import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin, Empty, Space } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  FormPageTemplate,
  BaseInfoForm,
} from '@donglegeyu/company-ui'
import type { BaseInfoFormRef, FormField, FormFieldItem, FormValues } from '@donglegeyu/company-ui'
import type { PageSchemaVO, FieldConfig, SelectOption } from '@/pages/generator/types'
import { createEmptyFormPage, normalizeFormFieldGroups } from '@/pages/generator/types'
import {
  getPageSchemaByPageKey,
  fetchDynamicQuery,
  fetchMetaOptions,
  resolveMockOptions,
  saveDynamicRecord,
  buildColumnKeyMap,
  mapRecordToFront,
  mapValuesToDb,
} from '@/pages/generator/services'
import PageErrorBoundary from '@/components/PageErrorBoundary'

/** 字段配置 → BaseInfoForm 字段定义（与 PreviewPanel 预览映射保持一致） */
function toDynamicFormField(field: FieldConfig, options?: SelectOption[]): FormFieldItem {
  // required 仅控制星号显示，真正拦截空值靠 rules（BaseInfoForm 透传 antd Form.Item）
  const required = field.isRequired === true
  const label = field.fieldLabel || field.fieldKey
  const base = {
    name: field.fieldKey,
    label,
    required,
    rules: required ? [{ required: true, message: `${label}不能为空` }] : undefined,
  }
  switch (field.fieldType) {
    case 'number':
      return { ...base, type: 'input-number', placeholder: '请输入' }
    case 'select':
      return { ...base, type: 'select', placeholder: '请选择', options }
    case 'select-multi':
      return { ...base, type: 'select-multi', placeholder: '请选择', options }
    case 'radio':
      return { ...base, type: 'radio', options }
    case 'cascader':
      return { ...base, type: 'cascader', placeholder: '请选择', options }
    case 'date':
      return { ...base, type: 'date', placeholder: '请选择' }
    case 'daterange':
      return { ...base, type: 'daterange' }
    case 'status':
      return {
        ...base,
        type: 'select',
        placeholder: '请选择',
        options: field.statusMap.map((s) => ({ label: s.text, value: s.value })),
      }
    default:
      return { ...base, type: 'input', placeholder: '请输入' }
  }
}

function DynamicFormPageInner() {
  const { pageKey = '', id = '' } = useParams()
  const navigate = useNavigate()
  const baseFormRef = useRef<BaseInfoFormRef>(null)
  const [formValues, setFormValues] = useState<FormValues>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [schema, setSchema] = useState<PageSchemaVO | null>(null)
  const [error, setError] = useState<string | null>(null)
  // 远程选项缓存（tableRef 数据源运行时真实加载，api/dict 暂用演示数据兜底）
  const [optionsMap, setOptionsMap] = useState<Record<string, SelectOption[]>>({})

  const isPreview = id === 'preview'
  const isEdit = !isPreview && id !== ''

  // 返回逻辑：预览模式回 page-generator；history 兜底回关联列表页
  const handleBack = () => {
    if (isPreview) {
      navigate('/page-generator')
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      const listPageKey = schema?.sourceListPageKey || pageKey.replace(/-form$/, '')
      navigate(`/dynamic/${listPageKey}`)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPageSchemaByPageKey(pageKey)
      .then((res) => {
        if (res.code === 200 && res.data) {
          setSchema(res.data)
        } else {
          setError('未找到该页面配置')
        }
      })
      .catch(() => setError('加载页面配置失败'))
      .finally(() => setLoading(false))
  }, [pageKey])

  const sortedFields = useMemo(
    () => [...(schema?.fields || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [schema],
  )

  const formFields = useMemo(
    () => sortedFields.filter((f) => f.fieldKey && !f.isAction),
    [sortedFields],
  )

  // fieldKey → dbColumn 映射（提交/回填时转换 key）
  const columnKeyMap = useMemo(() => buildColumnKeyMap(sortedFields), [sortedFields])

  // 编辑模式：拉取记录回填表单；预览/新建模式：空表单
  useEffect(() => {
    if (!schema) return
    if (isPreview || !isEdit || !schema.tableName) {
      setFormValues({})
      return
    }
    fetchDynamicQuery({
      table: schema.tableName,
      current: 1,
      size: 1,
      filter: `id:eq:${id}`,
    })
      .then((res) => {
        const record = res.code === 200 ? res.data?.records?.[0] : undefined
        if (record) {
          // 后端记录 key 是 dbColumn（snake_case）→ 转成 fieldKey 回填表单
          setFormValues(mapRecordToFront(record, columnKeyMap) as FormValues)
        } else {
          CompanyMessage.warning('未找到该条记录，已展示空表单')
          setFormValues({})
        }
      })
      .catch(() => {
        CompanyMessage.warning('记录加载失败，已展示空表单')
        setFormValues({})
      })
  }, [schema, id, isPreview, isEdit, columnKeyMap])

  // 远程选项加载：tableRef 数据源走真实接口，其余用配置/演示数据
  useEffect(() => {
    if (!schema) return
    let cancelled = false
    formFields.forEach(async (field) => {
      const ds = field.dataSource
      if (ds?.kind === 'tableRef' && ds.table && ds.labelKey && ds.valueKey) {
        const res = await fetchMetaOptions(ds.table, ds.labelKey, ds.valueKey, ds.filterExpr)
        if (!cancelled && res.code === 200 && res.data) {
          setOptionsMap((prev) => ({ ...prev, [field.fieldKey]: res.data }))
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [schema, formFields])

  const getOptions = (field: FieldConfig): SelectOption[] => {
    if (optionsMap[field.fieldKey]) return optionsMap[field.fieldKey]
    const ds = field.dataSource
    if (ds?.kind === 'static') return ds.options
    return resolveMockOptions(field)
  }

  // 字段配置 → BaseInfoForm 字段定义（与 PreviewPanel 预览映射一致）
  const formFieldDefs = useMemo<FormField[]>(() => {
    // 旧 groupName 数据迁移为一等分组结构（field.groupId + formConfig.fieldGroups）
    const { fields: normFields, formConfig } = normalizeFormFieldGroups({
      fields: formFields,
      formConfig: schema?.formConfig,
    })
    const groups = formConfig?.fieldGroups ?? []
    const defs = normFields.map((f) => toDynamicFormField(f, getOptions(f)))
    const groupIds = new Set(groups.map((g) => g.id))
    const out: FormField[] = []
    // 未分组字段平铺在前（与生成器配置界面顺序一致）
    normFields.forEach((f, i) => {
      if (!f.groupId || !groupIds.has(f.groupId)) out.push(defs[i])
    })
    // 分组小节按 fieldGroups 数组顺序，组内字段按字段顺序（BaseInfoForm section，与 FormPageTemplate 分组示例一致）
    groups.forEach((g) => {
      const children = normFields
        .map((f, i) => (f.groupId === g.id ? defs[i] : null))
        .filter((d): d is FormFieldItem => d !== null)
      if (children.length) {
        out.push({ type: 'section', label: g.name.trim() || '未命名分组', children })
      }
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formFields, optionsMap, schema])

  // stay=true（保存表单）：保存成功后留在当前页；否则（提交表单）成功后返回上一页
  const handleSubmit = async (stay?: boolean) => {
    const ok = await baseFormRef.current?.validate()
    if (!ok) return
    const values = baseFormRef.current?.form?.getFieldsValue()
    if (isPreview) {
      CompanyMessage.info(stay ? '保存（演示）' : '提交（演示）')
      return
    }
    if (!schema?.tableName) {
      CompanyMessage.warning('该页面未配置业务表，无法提交')
      return
    }
    setSubmitting(true)
    try {
      // 表单值 key 是 fieldKey（camelCase）→ 转成 dbColumn（snake_case）提交
      const dbValues = mapValuesToDb(
        (values ?? {}) as Record<string, unknown>,
        columnKeyMap,
      )
      const res = await saveDynamicRecord(schema.tableName, isEdit ? id : null, dbValues)
      if (res.code === 200) {
        CompanyMessage.success(stay ? '保存成功' : isEdit ? '保存成功' : '提交成功')
        if (!stay) handleBack()
      } else {
        CompanyMessage.error(res.message || (stay ? '保存失败' : '提交失败'))
      }
    } catch {
      CompanyMessage.error(stay ? '保存失败，请稍后重试' : '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !schema) {
    return (
      <div style={{ padding: 60 }}>
        <Empty description={error || '未找到页面配置'} />
      </div>
    )
  }

  const title = isPreview
    ? `${schema.pageName}（预览）`
    : `${isEdit ? '编辑' : '新增'}${schema.pageName}`

  // 表单页模板配置（老数据兜底：无 formConfig 时显示默认 取消/确定；有 formConfig 但按钮为空则不显示底部操作区）
  const fc = schema.formConfig
  const footerButtons = fc?.footerButtons ?? (fc ? [] : createEmptyFormPage().footerButtons)

  return (
    <FormPageTemplate
      title={title}
      showBack
      onBack={handleBack}
      showFooter={footerButtons.length > 0}
      footerPosition="fixed"
      // 分组（section）在最上面时保持组件默认上边距 8px；否则加大到 24px
      contentStyle={formFieldDefs[0]?.type === 'section' ? undefined : { paddingTop: 24 }}
      footer={
        footerButtons.length > 0 ? (
          <div className="form-footer-actions">
            <Space>
              {footerButtons.map((btn, i) => (
                <CompanyButton
                  key={btn.btnKey || i}
                  type={btn.btnType === 'primary' ? 'primary' : 'default'}
                  loading={btn.action === 'cancel' ? false : submitting}
                  onClick={() => {
                    if (btn.action === 'submit') handleSubmit()
                    else if (btn.action === 'save') handleSubmit(true)
                    else handleBack()
                  }}
                >
                  {btn.btnLabel || (btn.action === 'submit' ? '提交' : btn.action === 'save' ? '保存' : '取消')}
                </CompanyButton>
              ))}
            </Space>
          </div>
        ) : undefined
      }
    >
      <div style={{ padding: '16px 24px' }}>
        {formFields.length === 0 ? (
          <div style={{
            padding: '24px 0',
            textAlign: 'center',
            color: '#bbb',
            fontSize: 13,
            background: '#fafafa',
            borderRadius: 4,
            border: '1px dashed #e0e0e0',
          }}>
            表单项区域（该页面暂未配置字段）
          </div>
        ) : (
          <BaseInfoForm
            ref={baseFormRef}
            value={formValues}
            fields={formFieldDefs}
            onChange={setFormValues}
          />
        )}
      </div>
    </FormPageTemplate>
  )
}

export default function DynamicFormPage() {
  return (
    <PageErrorBoundary>
      <DynamicFormPageInner />
    </PageErrorBoundary>
  )
}
