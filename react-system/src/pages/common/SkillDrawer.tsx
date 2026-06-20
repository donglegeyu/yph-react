import { useEffect, useState, type ReactNode } from 'react'
import { Input, Select, Upload, ConfigProvider, Cascader, type UploadFile, type UploadProps } from 'antd'
import { CompanyDrawer, CompanyButton, CompanyMessage, CompanyForm } from '@donglegeyu/company-ui'
import { UploadOutlined, PlusOutlined } from '@ant-design/icons'
import { API_ENDPOINTS } from '@/constants/api'
import { categoryOptions } from './categoryOptions'

export interface SkillFormData {
  id?: number
  skillName: string
  category?: string[]
  category1?: string
  category2?: string
  category3?: string
  certificateType: string
  exampleImage: string
}

interface SkillDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues?: Partial<SkillFormData>
  onClose: () => void
  onSuccess: () => void
}

const defaultCertificateTypeOptions = [
  { label: '特种作业操作证', value: '特种作业操作证' },
  { label: '上岗证', value: '上岗证' },
]

export default function SkillDrawer({
  open,
  mode,
  initialValues,
  onClose,
  onSuccess,
}: SkillDrawerProps) {
  const [form] = CompanyForm.useForm<SkillFormData>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [certificateTypeOptions, setCertificateTypeOptions] = useState(defaultCertificateTypeOptions)
  const [certInputVisible, setCertInputVisible] = useState(false)
  const [certInputValue, setCertInputValue] = useState('')

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
        certificateType: initialValues.certificateType,
        exampleImage: initialValues.exampleImage || '',
      })
      const urls = (initialValues.exampleImage || '')
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
      setFileList(urls.map((url, index) => ({
        uid: `existing-${index}`,
        name: `示例图${index + 1}`,
        status: 'done' as const,
        url,
        response: { data: url },
      })))
    } else {
      form.resetFields()
      setFileList([])
    }
  }, [open, initialValues, form])

  const handleCategoryChange = (value: (string | undefined)[]) => {
    const [c1, c2, c3] = value || []
    form.setFieldsValue({
      category1: c1 || '',
      category2: c2 || '',
      category3: c3 || '',
    })
  }

  const handleAddCertificateType = () => {
    const value = certInputValue.trim()
    if (!value) {
      CompanyMessage.error('请输入证件类型')
      return
    }
    if (certificateTypeOptions.some((o) => o.value === value)) {
      CompanyMessage.error('该证件类型已存在')
      return
    }
    const newOption = { label: value, value }
    setCertificateTypeOptions([...certificateTypeOptions, newOption])
    form.setFieldValue('certificateType', value)
    setCertInputValue('')
    setCertInputVisible(false)
    CompanyMessage.success('新增成功')
  }

  const handleCertificateTypeChange = async (value: string) => {
    if (!value) {
      form.setFieldValue('exampleImage', '')
      setFileList([])
      return
    }
    try {
      const res = await fetch(`${API_ENDPOINTS.CERTIFICATE_IMAGES}/by-type?certificateType=${encodeURIComponent(value)}`)
      const json = await res.json()
      const images = json.data?.exampleImage || ''
      form.setFieldValue('exampleImage', images)
      const urls = images.split(',').map((u: string) => u.trim()).filter(Boolean)
      setFileList(urls.map((url: string, index: number) => ({
        uid: `existing-${index}`,
        name: `示例图${index + 1}`,
        status: 'done' as const,
        url,
        response: { data: url },
      })))
    } catch {
      // 查询失败保持当前状态
    }
  }

  const certificateDropdownRender = (menu: ReactNode) => (
    <>
      {menu}
      <div style={{ padding: '4px 8px', borderTop: '1px solid rgba(5,5,5,0.06)' }}>
        {certInputVisible ? (
          <div style={{ display: 'flex', gap: 4, paddingBlock: 4 }}>
            <Input
              size="small"
              placeholder="请输入证件类型"
              value={certInputValue}
              onChange={(e) => setCertInputValue(e.target.value)}
              onPressEnter={handleAddCertificateType}
              style={{ flex: 1 }}
            />
            <CompanyButton size="small" type="primary" onClick={handleAddCertificateType}>
              确定
            </CompanyButton>
            <CompanyButton size="small" onClick={() => { setCertInputVisible(false); setCertInputValue('') }}>
              取消
            </CompanyButton>
          </div>
        ) : (
          <div
            onClick={() => setCertInputVisible(true)}
            style={{ cursor: 'pointer', paddingBlock: 6, color: 'var(--color-primary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <PlusOutlined />
            <span>新增证件类型</span>
          </div>
        )}
      </div>
    </>
  )

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: newList }) => {
    setFileList(newList)
    const urls = newList
      .filter((f) => f.status === 'done')
      .map((f) => (f.url ? f.url : (f.response?.data as string)))
      .filter(Boolean)
    form.setFieldValue('exampleImage', urls.join(','))
  }

  const handleUploadRemove: UploadProps['onRemove'] = (file) => {
    const removeUrl = file.url || (file.response?.data as string)
    const newList = fileList.filter(
      (f) => (f.url || (f.response?.data as string)) !== removeUrl
    )
    setFileList(newList)
    const current = (form.getFieldValue('exampleImage') as string) || ''
    const urls = current
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u && u !== removeUrl)
    form.setFieldValue('exampleImage', urls.join(','))
  }

  const uploadProps: UploadProps = {
    name: 'file',
    action: API_ENDPOINTS.FILE_UPLOAD,
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    listType: 'picture-card',
    maxCount: 5,
    multiple: true,
    fileList,
    onChange: handleUploadChange,
    onRemove: handleUploadRemove,
    onPreview: (file) => {
      const url = file.url || (file.response?.data as string)
      if (url) {
        window.open(url, '_blank')
      }
    },
  }

  const handleSubmit = async (keepOpen = false) => {
    try {
      const values = await form.validateFields()
      const payload = {
        skillName: values.skillName,
        category1: values.category1 || '',
        category2: values.category2 || '',
        category3: values.category3 || '',
        certificateType: values.certificateType,
        exampleImage: values.exampleImage || '',
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
          form.resetFields()
          setFileList([])
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
          name="skillName"
          label="服务技能"
          rules={[{ required: true, message: '请输入' }]}
        >
          <Input placeholder="请输入" />
        </CompanyForm.Item>

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
          name="certificateType"
          label="证件类型"
          rules={[{ required: true, message: '请选择' }]}
        >
          <Select
            placeholder="请选择"
            options={certificateTypeOptions}
            dropdownRender={certificateDropdownRender}
            onChange={handleCertificateTypeChange}
          />
        </CompanyForm.Item>

        <CompanyForm.Item name="exampleImage" hidden>
          <Input />
        </CompanyForm.Item>

        <CompanyForm.Item label="示例图（最多5张）">
          <ConfigProvider
            theme={{
              components: {
                Upload: {
                  pictureCardSize: 64,
                },
              },
            }}
          >
            <Upload {...uploadProps}>
              <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                <UploadOutlined style={{ fontSize: 16 }} />
                <div style={{ marginTop: 2, fontSize: 12 }}>上传图片</div>
              </div>
            </Upload>
          </ConfigProvider>
        </CompanyForm.Item>
      </CompanyForm>
    </CompanyDrawer>
  )
}
