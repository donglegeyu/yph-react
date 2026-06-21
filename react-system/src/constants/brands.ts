export interface BrandOption {
  value: string
  label: string
}

export const BRAND_LIST: BrandOption[] = [
  { value: 'midea', label: '美的' },
  { value: 'haier', label: '海尔' },
  { value: 'gree', label: '格力' },
  { value: 'supor', label: '苏泊尔' },
  { value: 'philips', label: '飞利浦' },
]

export const BRAND_MAP: Record<string, string> = BRAND_LIST.reduce(
  (acc, item) => {
    acc[item.value] = item.label
    return acc
  },
  {} as Record<string, string>,
)

export function formatBrandNames(brandNames?: string): string {
  if (!brandNames) return ''
  return brandNames
    .split(',')
    .map((v) => BRAND_MAP[v.trim()] || v.trim())
    .filter(Boolean)
    .join('、')
}
