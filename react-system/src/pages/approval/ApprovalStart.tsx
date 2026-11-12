import { useState } from 'react'
import { theme } from 'antd'
import {
  CompanyForm,
  CompanyInput,
  CompanyInputNumber,
  CompanyMessage,
  CompanySelect,
  FormPageTemplate,
  SectionTitle,
} from '@donglegeyu/company-ui'
import { useNavigate } from 'react-router-dom'
import { startInstance, toUserOptions } from './api'
import { useSysUsers } from './useSysUsers'

interface FormValues {
  title: string
  reason?: string
  amount?: number
  ccUserIds?: number[]
}

export default function ApprovalStart() {
  const [form] = CompanyForm.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const { users, loading: usersLoading } = useSysUsers()

  const onFinish = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const res = await startInstance(values)
      if (res.code === 200 && res.data) {
        CompanyMessage.success(`已提交，单号 ${res.data.businessNo}`)
        form.resetFields()
        navigate('/approval/mine')
      } else {
        CompanyMessage.error(res.message || '提交失败')
      }
    } catch {
      CompanyMessage.error('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title="发起审批"
      submitLoading={submitting}
      submitText="提交"
      cancelText="重置"
      onSubmit={() => form.submit()}
      onCancel={() => form.resetFields()}
      topContent={
        <div style={{ color: token.colorTextSecondary, fontSize: token.fontSize }}>
          P0 试点流程：材料申请（materialApplication），提交后进入管理员审批节点。
        </div>
      }
    >
      <SectionTitle title="申请信息" />
      <CompanyForm form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 640 }}>
        <CompanyForm.Item
          name="title"
          label="申请标题"
          rules={[
            { required: true, message: '请输入申请标题' },
            { max: 100, message: '标题不超过 100 字' },
          ]}
        >
          <CompanyInput placeholder="例如：办公室耗材采购申请" maxLength={100} showCount />
        </CompanyForm.Item>

        <CompanyForm.Item name="reason" label="申请事由" rules={[{ max: 500, message: '事由不超过 500 字' }]}>
          <CompanyInput.TextArea rows={4} maxLength={500} showCount placeholder="说明申请背景与用途" />
        </CompanyForm.Item>

        <CompanyForm.Item name="amount" label="申请金额（元）">
          <CompanyInputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="选填" />
        </CompanyForm.Item>

        <CompanyForm.Item name="ccUserIds" label="抄送人" extra="选填，审批动态会抄送给所选同事">
          <CompanySelect
            mode="multiple"
            showSearch
            allowClear
            optionFilterProp="label"
            loading={usersLoading}
            options={toUserOptions(users)}
            placeholder="请选择抄送人"
          />
        </CompanyForm.Item>
      </CompanyForm>
    </FormPageTemplate>
  )
}
