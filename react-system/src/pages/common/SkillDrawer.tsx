import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Input, Select, Cascader, Image } from 'antd'
import { CompanyDrawer, CompanyButton, CompanyMessage, CompanyForm } from '@donglegeyu/company-ui'
import { EditOutlined } from '@ant-design/icons'
import { API_ENDPOINTS } from '@/constants/api'
import { categoryOptions } from './categoryOptions'

export interface SkillFormData {
  id?: number
  skillName: string
  category?: string[]
  category1?: string
  category2?: string
  category3?: string
  categoryAlias?: string
  certificateType: string
}

interface SkillDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues?: Partial<SkillFormData>
  certOptions: { label: string; value: string }[]
  onOpenManageDrawer: () => void
  manageDrawerOpen?: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function SkillDrawer({
  open,
  mode,
  initialValues,
  certOptions,
  onOpenManageDrawer,
  manageDrawerOpen,
  onClose,
  onSuccess,
}: SkillDrawerProps) {
  const [form] = CompanyForm.useForm<SkillFormData>()
  const [submitting, setSubmitting] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [skillNameOptions, setSkillNameOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.SKILLS}?pageNum=1&pageSize=1000`)
        const json = await res.json()
        if (cancelled) return
        const list = (json.data?.records || json.data || []) as Array<{ skillName: string }>
        const names = list
          .map((item) => item.skillName)
          .filter(Boolean)
          .filter((v, i, arr) => arr.indexOf(v) === i)
        setSkillNameOptions(names.map((n) => ({ label: n, value: n })))
      } catch {
        // ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [open])

  const loadPreviewImages = async (certType: string) => {
    if (!certType) {
      setPreviewImages([])
      return
    }
    setPreviewLoading(true)
    try {
      const res = await fetch(`${API_ENDPOINTS.CERTIFICATE_IMAGES}/by-type?certificateType=${encodeURIComponent(certType)}`)
      const json = await res.json()
      const raw = json.data?.exampleImage || ''
      setPreviewImages(raw.split(',').map((u: string) => u.trim()).filter(Boolean))
    } catch {
      setPreviewImages([])
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    if (open && initialValues?.certificateType) {
      loadPreviewImages(initialValues.certificateType)
    } else if (!open) {
      setPreviewImages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues?.certificateType])

  useEffect(() => {
    if (!open) return
    if (initialValues && Object.keys(initialValues).length > 0) {
      const categoryPath: string[] = []
      if (initialValues.category1) categoryPath.push(initialValues.category1)
      if (initialValues.category2) categoryPath.push(initialValues.category2)
      if (initialValues.category3) categoryPath.push(initialValues.category3)
      form.setFieldsValue({
        skillName: initialValues.skillName,
        category: categoryPath,
        category1: initialValues.category1,
        category2: initialValues.category2,
        category3: initialValues.category3,
        categoryAlias: initialValues.categoryAlias,
        certificateType: initialValues.certificateType,
      })
    } else {
      form.resetFields()
    }
  }, [open, initialValues, form])

  const handleCategoryChange = (value: (string | undefined)[]) => {
    const [c1, c2, c3] = value || []
    form.setFieldsValue({
      category1: c1 || '',
      category2: c2 || '',
      category3: c3 || '',
      categoryAlias: c3 || '',
    })
  }

  const selectOptions = useMemo(() => certOptions.map((o) => ({
    label: o.label,
    value: o.value,
  })), [certOptions])

  const certificatePopupRender = (menu: ReactNode) => (
    <>
      {menu}
      <div style={{ borderTop: '1px solid rgba(5,5,5,0.06)', padding: '4px 8px' }}>
        <div
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setSelectOpen(false); onOpenManageDrawer() }}
          style={{ cursor: 'pointer', paddingBlock: 6, color: 'var(--ant-color-primary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <EditOutlined />
          <span>证件类型管理</span>
        </div>
      </div>
    </>
  )

  const handleSubmit = async (keepOpen = false) => {
    try {
      const values = await form.validateFields()
      const payload = {
        skillName: values.skillName,
        category1: values.category1 || '',
        category2: values.category2 || '',
        category3: values.category3 || '',
        categoryAlias: values.categoryAlias || '',
        certificateType: values.certificateType,
      }

      const isEdit = mode === 'edit' && initialValues?.id
      const url = isEdit
        ? `${API_ENDPOINTS.SKILLS}/${initialValues!.id}`
        : API_ENDPOINTS.SKILLS
      const method = isEdit ? 'PUT' : 'POST'

      setSubmitting(true)
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (json.code === 200) {
        CompanyMessage.success(isEdit ? '编辑成功' : '新增成功')
        onSuccess()
        if (keepOpen && !isEdit) {
          const skillName = form.getFieldValue('skillName')
          form.resetFields()
          form.setFieldValue('skillName', skillName)
        } else {
          onClose()
        }
      } else {
        CompanyMessage.error(json.message || '操作失败')
      }
    } catch {
      CompanyMessage.error('请填写完整信息')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CompanyDrawer
      title={mode === 'edit' ? '编辑技能' : '新增技能'}
      open={open}
      onClose={onClose}
      width={375}
      destroyOnClose
      forceRender
      rootClassName={manageDrawerOpen ? 'skill-drawer-offset' : undefined}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <CompanyButton onClick={onClose}>取消</CompanyButton>
          {mode === 'create' ? (
            <>
              <CompanyButton loading={submitting} onClick={() => handleSubmit(true)}>
                提交并新建
              </CompanyButton>
              <CompanyButton type="primary" loading={submitting} onClick={() => handleSubmit(false)}>
                提交
              </CompanyButton>
            </>
          ) : (
            <CompanyButton type="primary" loading={submitting} onClick={() => handleSubmit(false)}>
              保存
            </CompanyButton>
          )}
        </div>
      }
    >
      <CompanyForm
        form={form}
        layout="vertical"
      >
        <CompanyForm.Item
          name="category"
          label="三级品类"
          rules={[
            {
              required: true,
              validator: (_rule, value: (string | undefined)[] | undefined) => {
                if (!value || value.length < 3 || !value[0] || !value[1] || !value[2]) {
                  return Promise.reject(new Error('请选择'))
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <Cascader
            placeholder="请选择"
            options={categoryOptions}
            changeOnSelect={false}
            fieldNames={{ label: 'label', value: 'value', children: 'children' }}
            displayRender={(labels) => labels.join(' / ')}
            onChange={handleCategoryChange}
          />
        </CompanyForm.Item>

        <CompanyForm.Item name="category1" hidden>
          <Input />
        </CompanyForm.Item>
        <CompanyForm.Item name="category2" hidden>
          <Input />
        </CompanyForm.Item>
        <CompanyForm.Item name="category3" hidden>
          <Input />
        </CompanyForm.Item>

        <CompanyForm.Item
          name="categoryAlias"
          label="三级品类别名"
          rules={[{ required: true, message: '请输入' }]}
        >
          <Input placeholder="请输入" />
        </CompanyForm.Item>

        <CompanyForm.Item
          name="skillName"
          label="服务技能"
          rules={[{ required: true, message: '请选择' }]}
        >
          <Select
            placeholder="请选择"
            showSearch
            options={skillNameOptions}
          />
        </CompanyForm.Item>

        <CompanyForm.Item
          name="certificateType"
          label="证件类型"
        >
          <Select
            placeholder="请选择"
            open={selectOpen}
            onOpenChange={setSelectOpen}
            options={selectOptions}
            dropdownRender={certificatePopupRender}
            onChange={(v) => loadPreviewImages(v)}
          />
        </CompanyForm.Item>

        {previewImages.length > 0 && (
          <CompanyForm.Item label="示例图">
            <Image.PreviewGroup>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {previewImages.map((src) => (
                  <Image
                    key={src}
                    src={src}
                    width={64}
                    height={64}
                    style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(5,5,5,0.06)' }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          </CompanyForm.Item>
        )}
        {previewLoading && (
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 16 }}>加载示例图...</div>
        )}
      </CompanyForm>
    </CompanyDrawer>
  )
}
