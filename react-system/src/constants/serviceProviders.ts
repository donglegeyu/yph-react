export interface ServiceProviderOption {
  id: number
  name: string
  category: 'internal' | 'outsource'
  categoryName: string
}

export const SERVICE_PROVIDER_LIST: ServiceProviderOption[] = [
  { id: 1, name: '北京建工集团有限公司', category: 'outsource', categoryName: '外部员工' },
  { id: 2, name: '上海建工集团', category: 'outsource', categoryName: '外部员工' },
  { id: 3, name: '广州建筑股份有限公司 / 第三分公司', category: 'outsource', categoryName: '外部员工' },
  { id: 4, name: '深圳建筑工程公司', category: 'internal', categoryName: '内部员工' },
  { id: 5, name: '成都建工集团', category: 'internal', categoryName: '内部员工' },
]

export const getServiceProviderOptions = () =>
  SERVICE_PROVIDER_LIST.map((item) => ({
    label: item.name,
    value: item.id,
  }))

export const getServiceProviderById = (id: number) =>
  SERVICE_PROVIDER_LIST.find((item) => item.id === id)

export const getServiceProviderByName = (name: string) =>
  SERVICE_PROVIDER_LIST.find((item) => item.name === name)
