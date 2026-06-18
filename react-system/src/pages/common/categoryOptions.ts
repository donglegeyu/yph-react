import type { CascaderProps } from 'antd'

export interface CategoryOption {
  value: string
  label: string
  children?: CategoryOption[]
}

export const categoryOptions: CategoryOption[] = [
  {
    value: '到家(服务类)',
    label: '到家(服务类)',
    children: [
      {
        value: '家电服务',
        label: '家电服务',
        children: [
          { value: '家电安装服务', label: '家电安装服务' },
          { value: '家电维修服务', label: '家电维修服务' },
          { value: '家电检修服务', label: '家电检修服务' },
          { value: '家电移机服务', label: '家电移机服务' },
          { value: '家电拆装服务', label: '家电拆装服务' },
        ],
      },
      {
        value: '清洗服务',
        label: '清洗服务',
        children: [
          { value: '家电清洗服务', label: '家电清洗服务' },
          { value: '家电保养服务', label: '家电保养服务' },
        ],
      },
    ],
  },
  {
    value: '安防(服务类)',
    label: '安防(服务类)',
    children: [
      {
        value: '安防服务',
        label: '安防服务',
        children: [
          { value: '安防厨房服务', label: '安防厨房服务' },
          { value: '安防监控服务', label: '安防监控服务' },
          { value: '安防报警服务', label: '安防报警服务' },
        ],
      },
    ],
  },
]

export const category1Options = categoryOptions.map((o) => ({
  label: o.label,
  value: o.value,
}))

export function findCategory2Options(cat1: string): CategoryOption[] {
  const found = categoryOptions.find((o) => o.value === cat1)
  return found?.children ?? []
}

export function findCategory3Options(cat1: string, cat2: string): CategoryOption[] {
  const c1 = categoryOptions.find((o) => o.value === cat1)
  const c2 = c1?.children?.find((o) => o.value === cat2)
  return c2?.children ?? []
}

export function buildCategoryPath(cat1?: string, cat2?: string, cat3?: string): string {
  return [cat1, cat2, cat3].filter(Boolean).join(' / ')
}

export const cascaderFieldNames: CascaderProps['fieldNames'] = {
  label: 'label',
  value: 'value',
  children: 'children',
}
