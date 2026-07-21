import { Input, Button, Space } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { SelectOption } from '../types'

interface Props {
  value: SelectOption[]
  onChange: (value: SelectOption[]) => void
}

export default function OptionsEditor({ value, onChange }: Props) {
  const handleAdd = () => {
    onChange([...value, { label: '', value: '' }])
  }

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const handleChange = (idx: number, patch: Partial<SelectOption>) => {
    const next = value.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {value.length === 0 && (
        <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>暂无选项，点击下方新增</span>
      )}
      {value.map((opt, idx) => (
        <Space key={idx} size={6} style={{ width: '100%' }}>
          <Input
            placeholder="显示文字 label"
            value={opt.label}
            onChange={(e) => handleChange(idx, { label: e.target.value })}
            style={{ width: 130 }}
            size="small"
          />
          <Input
            placeholder="值 value"
            value={String(opt.value)}
            onChange={(e) => handleChange(idx, { value: e.target.value })}
            style={{ width: 130 }}
            size="small"
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemove(idx)}
          />
        </Space>
      ))}
      <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAdd} block>
        新增选项
      </Button>
    </div>
  )
}
