import { Select } from 'antd'
import type { SelectProps } from 'antd'

interface Option {
  label: string
  value: string | number
}

interface GlobalSelectProps extends Omit<SelectProps, 'options'> {
  options?: Option[]
}

export default function GlobalSelect(props: GlobalSelectProps) {
  return (
    <Select
      {...props}
      options={props.options}
      style={{ width: 400, ...props.style as React.CSSProperties }}
    />
  )
}
