import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react'
import { Form, Row, Col, Input, Select, InputNumber } from 'antd'
import type { FormInstance } from 'antd'

export interface FormField {
  name: string
  label: string
  type: 'input' | 'select' | 'textarea' | 'input-number'
  placeholder?: string
  readonly?: boolean
  disabled?: boolean
  options?: { value: string | number; label: string }[]
  rules?: any[]
  required?: boolean
}

export interface BaseInfoFormProps {
  value: Record<string, any>
  fields: FormField[]
  layout?: 'horizontal' | 'vertical'
  loading?: boolean
  onChange?: (value: Record<string, any>) => void
  onFieldChange?: (field: string, value: any) => void
}

export interface BaseInfoFormRef {
  validate: () => Promise<void>
  form: FormInstance | null
}

const BaseInfoForm = forwardRef<BaseInfoFormRef, BaseInfoFormProps>(({
  value,
  fields,
  layout = 'horizontal',
  onChange,
  onFieldChange,
}, ref) => {
  const [form] = Form.useForm()
  const [contentWidth, setContentWidth] = useState(1200)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevValueRef = useRef(value)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      const parentWidth = container.parentElement?.clientWidth || window.innerWidth
      setContentWidth(parentWidth)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container.parentElement || container)

    return () => observer.disconnect()
  }, [])

  const getColSpan = () => {
    if (contentWidth < 560) return 24
    if (contentWidth < 860) return 12
    if (contentWidth < 1200) return 8
    return 6
  }

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      form.setFieldsValue(value)
    }
  }, [value, form])

  const handleValuesChange = (_changedValues: Record<string, any>, allValues: Record<string, any>) => {
    const key = Object.keys(_changedValues)[0]
    if (key) {
      onFieldChange?.(key, _changedValues[key])
    }
    onChange?.(allValues)
  }

  useImperativeHandle(ref, () => ({
    validate: () => form.validateFields().then(() => {}),
    form,
  }), [form])

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'input':
        return (
          <Input
            placeholder={field.placeholder ?? '请输入'}
            readOnly={field.readonly}
            disabled={field.disabled}
          />
        )
      case 'select':
        return (
          <Select
            placeholder={field.placeholder ?? '请选择'}
            disabled={field.disabled}
            options={field.options}
            style={{ width: '100%' }}
          />
        )
      case 'textarea':
        return (
          <Input.TextArea
            placeholder={field.placeholder ?? '请输入'}
            disabled={field.disabled}
            style={{ width: '100%' }}
          />
        )
      case 'input-number':
        return (
          <InputNumber
            placeholder={field.placeholder ?? '请输入'}
            disabled={field.disabled}
            style={{ width: '100%' }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Form
        form={form}
        initialValues={value}
        layout={layout}
        onValuesChange={handleValuesChange}
        style={{ width: '100%' }}
      >
        <Row gutter={24}>
          {fields.map((field) => (
            <Col key={field.name} span={getColSpan()}>
              <Form.Item
                label={field.label}
                name={field.name}
                rules={field.rules}
                required={field.required}
              >
                {renderField(field)}
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Form>
    </div>
  )
})

BaseInfoForm.displayName = 'BaseInfoForm'

export default BaseInfoForm
