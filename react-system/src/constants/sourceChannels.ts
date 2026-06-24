export interface SourceChannelOption {
  value: string
  label: string
}

export const SOURCE_CHANNEL_LIST: SourceChannelOption[] = [
  { value: 'craftsman_app', label: '慧帮手app' },
  { value: 'platform_import', label: '中台导入' },
  { value: 'platform_create', label: '中台新增' },
  { value: 'portal_create', label: '协同门户新增' },
  { value: 'initial_data', label: '初始化数据' },
]

export const SOURCE_CHANNEL_MAP: Record<string, string> = SOURCE_CHANNEL_LIST.reduce(
  (acc, item) => {
    acc[item.value] = item.label
    return acc
  },
  {} as Record<string, string>,
)

export function formatSourceChannel(value?: string): string {
  if (!value) return '--'
  return SOURCE_CHANNEL_MAP[value] || value
}
