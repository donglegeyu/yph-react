import { useEffect, useState } from 'react'
import { Form, Input, Select, Upload, type UploadFile, type UploadProps } from 'antd'
import { CompanyDrawer, CompanyButton, CompanyMessage } from '@donglegeyu/company-ui'
import { UploadOutlined } from '@ant-design/icons'
import { API_ENDPOINTS } from '@/constants/api'

export interface SkillFormData {
  id?: number
  skillName: string
  secondaryCategory: string
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

const secondaryCategoryOptions = [
  { label: '到家/清洗类', value: '到家/清洗类' },
  { label: '到家/家电类', value: '到家/家电类' },
]

const certificateTypeOptions = [
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
  const [form] = Form.useForm<SkillFormData>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initialValues && Object.keys(initialValues).length > 0) {
      form.setFieldsValue({
        skillName: initialValues.skillName,
        secondaryCategory: initialValues.secondaryCategory,
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        skillName: values.skillName,
        secondaryCategory: values.secondaryCategory,
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
        onClose()
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
      width={480}
      destroyOnClose
      forceRender
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <CompanyButton onClick={onClose}>取消</CompanyButton>
          <CompanyButton type="primary" loading={submitting} onClick={handleSubmit}>
            保存
          </CompanyButton>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="skillName"
          label="服务技能"
          rules={[{ required: true, message: '请输入服务技能' }]}
        >
          <Input placeholder="请输入" />
        </Form.Item>

        <Form.Item
          name="secondaryCategory"
          label="二级品类"
          rules={[{ required: true, message: '请选择二级品类' }]}
        >
          <Select placeholder="请选择" options={secondaryCategoryOptions} />
        </Form.Item>

        <Form.Item
          name="certificateType"
          label="证件类型"
          rules={[{ required: true, message: '请选择证件类型' }]}
        >
          <Select placeholder="请选择" options={certificateTypeOptions} />
        </Form.Item>

        <Form.Item name="exampleImage" hidden>
          <Input />
        </Form.Item>

        <Form.Item label="示例图（最多5张）">
          <Upload {...uploadProps}>
            <div style={{ color: 'rgba(0,0,0,0.45)' }}>
              <UploadOutlined style={{ fontSize: 20 }} />
              <div style={{ marginTop: 4, fontSize: 12 }}>上传图片</div>
            </div>
          </Upload>
        </Form.Item>
      </Form>
    </CompanyDrawer>
  )
}
