import { useState, useCallback, useMemo, useEffect } from 'react'
import { Menu, Space, Form, Tag, Input, Select, Switch, Button, Tabs } from 'antd'
import {
  CompanyMessage,
  CompanyButton,
  ActionCell,
  type ActionButton,
  PageTitle,
  FilterForm,
  ColumnSettingsPanel,
  type ColumnField,
  SmartListTemplate,
  SectionTitle,
  BaseInfoForm,
  type FormField,
  FormFooterActions,
  FormPageTemplate,
  SvgIcon,
} from '@donglegeyu/company-ui'
import './ComponentPreview.scss'

interface BusinessComponent {
  key: string
  name: string
  enName: string
  group: string
}

const businessComponents: BusinessComponent[] = [
  { key: 'filter-form', name: '筛选表单', enName: 'FilterForm', group: '筛选' },
  { key: 'smart-list-template', name: '智能列表模板', enName: 'SmartListTemplate', group: '列表' },
  { key: 'column-settings-panel', name: '列设置面板', enName: 'ColumnSettingsPanel', group: '列表' },
  { key: 'list-page-template', name: '列表页模板', enName: 'ListPageTemplate', group: '列表' },
  { key: 'action-cell', name: '操作按钮', enName: 'ActionCell', group: '列表' },
  { key: 'page-title', name: '页面标题', enName: 'PageTitle', group: '基础' },
  { key: 'form-page-template', name: '表单模板', enName: 'FormPageTemplate', group: '表单' },
  { key: 'section-title', name: '区域标题', enName: 'SectionTitle', group: '表单' },
  { key: 'base-info-form', name: '多列表单', enName: 'BaseInfoForm', group: '表单' },
  { key: 'form-footer-actions', name: '底部操作栏', enName: 'FormFooterActions', group: '表单' },
]

const businessComponentGroups = [
  { key: '列表', name: '列表' },
  { key: '表单', name: '表单' },
  { key: '筛选', name: '筛选' },
  { key: '基础', name: '基础' },
]

const componentUpdateTimes: Record<string, string> = {
  'action-cell': '2024-01-15 10:30',
  'filter-form': '2024-01-13 09:15',
  'column-settings-panel': '2024-01-11 11:00',
  'page-title': '2024-01-09 08:45',
  'list-page-template': '2024-01-08 13:20',
  'smart-list-template': '2024-01-07 17:10',
  'section-title': '2024-01-04 09:45',
  'base-info-form': '2025-05-21 10:00',
  'form-footer-actions': '2025-05-21 10:00',
  'form-page-template': '2025-05-21 10:00',
}

export default function ComponentPreview() {
  const [selectedBusinessComponent, setSelectedBusinessComponent] = useState('action-cell')
  const [businessTokenTabKey, setBusinessTokenTabKey] = useState('config')

  const [businessNavWidth] = useState(200)
  const [tokensWidth, setTokensWidth] = useState(360)
  const [isTokensDragging, setIsTokensDragging] = useState(false)

  const [demoMaxVisible, setDemoMaxVisible] = useState(2)

  const [demoPageTitle, setDemoPageTitle] = useState('页面标题')
  const [showPageTitleActions, setShowPageTitleActions] = useState(true)
  const [showPageTitleBack, setShowPageTitleBack] = useState(true)
  const [showPageTitleSuffix, setShowPageTitleSuffix] = useState(false)
  const [demoPageTitleSuffix, setDemoPageTitleSuffix] = useState('示例')

  const [demoSectionTitle, setDemoSectionTitle] = useState('基础信息')

  const [demoShowBack, setDemoShowBack] = useState(true)
  const [demoShowFooter, setDemoShowFooter] = useState(true)
  const [demoFooterPosition, setDemoFooterPosition] = useState<'fixed' | 'static'>('fixed')
  const [demoDomainPageLoading] = useState(false)
  const [demoDomainSubmitLoading, setDemoDomainSubmitLoading] = useState(false)
  const [demoFooterSubmitLoading, setDemoFooterSubmitLoading] = useState(false)

  const [demoFormData, setDemoFormData] = useState<Record<string, any>>({
    name: '',
    code: '',
    status: undefined,
    description: '',
    type: undefined,
    sort: 0,
  })

  const [demoMaterialFormData, setDemoMaterialFormData] = useState<Record<string, any>>({
    materialName: '',
    spec: '',
    quantity: undefined,
    unit: undefined,
  })

  const demoFormFields: FormField[] = [
    { name: 'name', label: '名称', type: 'input', required: true },
    { name: 'code', label: '编码', type: 'input', required: true },
    { name: 'status', label: '状态', type: 'select', options: [{ value: 1, label: '启用' }, { value: 0, label: '禁用' }] },
    { name: 'type', label: '类型', type: 'select', options: [{ value: 'type1', label: '类型1' }, { value: 'type2', label: '类型2' }] },
    { name: 'sort', label: '排序', type: 'input-number' },
    { name: 'description', label: '描述', type: 'textarea' },
  ]

  const demoMaterialFormFields: FormField[] = [
    { name: 'materialName', label: '材料名称', type: 'input', required: true },
    { name: 'spec', label: '规格', type: 'input', required: true },
    { name: 'quantity', label: '数量', type: 'input-number', required: true },
    { name: 'unit', label: '单位', type: 'select', options: [{ value: 'ton', label: '吨' }, { value: 'meter', label: '米' }, { value: 'piece', label: '张' }] },
  ]

  const [demoBaseInfoFormData, setDemoBaseInfoFormData] = useState<Record<string, any>>({
    domainName: '',
    domainKey: '',
    status: 1,
    category: undefined,
    sortOrder: undefined,
    contact: '',
    phone: '',
    description: '',
  })

  const demoBaseInfoFields: FormField[] = [
    { name: 'domainName', label: '域名称', type: 'input', required: true, rules: [{ required: true, message: '请输入域名称' }, { max: 50, message: '域名称不能超过50个字符' }] },
    { name: 'domainKey', label: '域标识', type: 'input', placeholder: '根据域名称自动生成', readonly: true },
    { name: 'status', label: '状态', type: 'select', options: [{ value: 1, label: '启用' }, { value: 0, label: '禁用' }] },
    { name: 'category', label: '分类', type: 'select', options: [{ value: 'system', label: '系统域' }, { value: 'business', label: '业务域' }, { value: 'data', label: '数据域' }] },
    { name: 'sortOrder', label: '排序', type: 'input-number' },
    { name: 'contact', label: '联系人', type: 'input' },
    { name: 'phone', label: '联系电话', type: 'input', rules: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }] },
    { name: 'description', label: '描述', type: 'textarea', rules: [{ max: 200, message: '描述不能超过200个字符' }] },
  ]

  const [demoButtons, setDemoButtons] = useState<ActionButton[]>([
    { key: 'edit', label: '编辑', onClick: () => CompanyMessage.info('点击了编辑') },
    { key: 'delete', label: '删除', danger: true, onClick: () => CompanyMessage.info('点击了删除') },
    { key: 'view', label: '查看', onClick: () => CompanyMessage.info('点击了查看') },
    { key: 'export', label: '导出', onClick: () => CompanyMessage.info('点击了导出') },
  ])

  const filterConfig = [
    { key: 'name', label: '名称', type: 'input' },
    { key: 'status', label: '状态', type: 'select', options: [{ label: '选项一', value: 'option1' }, { label: '选项二', value: 'option2' }, { label: '选项三', value: 'option3' }] },
  ]

  const columnFields: ColumnField[] = [
    { key: 'name', label: '名称', visible: true },
    { key: 'status', label: '状态', visible: true },
    { key: 'createTime', label: '创建时间', visible: true },
    { key: 'updateTime', label: '更新时间', visible: false },
  ]

  const smartListFields = [
    { key: 'name', label: '名称', type: 'input' as const },
    { key: 'spec', label: '规格', type: 'input' as const },
    { key: 'status', label: '状态', type: 'select' as const, options: [{ label: '待审核', value: 'pending' }, { label: '已通过', value: 'approved' }, { label: '已拒绝', value: 'rejected' }] },
    { key: 'brand', label: '品牌', type: 'input' as const },
    { key: 'supplier', label: '供应商', type: 'input' as const },
    { key: 'quantity', label: '数量', type: 'input' as const },
    { key: 'unit', label: '单位', type: 'input' as const },
    { key: 'price', label: '单价', type: 'input' as const },
    { key: 'createTime', label: '创建时间', type: 'daterange' as const },
    { key: 'action', label: '操作', type: 'item' as const },
  ]

  const smartListColumnFields: ColumnField[] = [
    { key: 'name', label: '名称', visible: true, width: 120 },
    { key: 'spec', label: '规格', visible: true, width: 100 },
    { key: 'status', label: '状态', visible: true, width: 80 },
    { key: 'brand', label: '品牌', visible: true, width: 100 },
    { key: 'supplier', label: '供应商', visible: true, width: 120 },
    { key: 'quantity', label: '数量', visible: true, width: 80 },
    { key: 'unit', label: '单位', visible: true, width: 60 },
    { key: 'createTime', label: '创建时间', visible: true, width: 120 },
    { key: 'action', label: '操作', visible: true, width: 120 },
  ]

  const smartListData = [
    { id: 1, name: '不锈钢板', spec: '304 2mm', brand: '宝钢', supplier: '华东物资', quantity: 100, unit: '吨', status: 'pending', statusText: '待审核', createTime: '2024-01-15' },
    { id: 2, name: '镀锌钢管', spec: 'DN50', brand: '华歧', supplier: '华北贸易', quantity: 200, unit: '米', status: 'approved', statusText: '已通过', createTime: '2024-01-14' },
    { id: 3, name: '铝合金板', spec: '3mm', brand: '南山', supplier: '华南建材', quantity: 50, unit: '张', status: 'rejected', statusText: '已拒绝', createTime: '2024-01-13' },
    { id: 4, name: '铜芯电缆', spec: '4x25mm²', brand: '远东', supplier: '华东电缆', quantity: 500, unit: '米', status: 'approved', statusText: '已通过', createTime: '2024-01-12' },
    { id: 5, name: 'PVC管材', spec: 'DN25', brand: '联塑', supplier: '华南管业', quantity: 300, unit: '根', status: 'pending', statusText: '待审核', createTime: '2024-01-11' },
    { id: 6, name: '水泥', spec: 'PO42.5', brand: '海螺', supplier: '华东水泥', quantity: 1000, unit: '吨', status: 'approved', statusText: '已通过', createTime: '2024-01-10' },
    { id: 7, name: '砂石料', spec: '中粗', brand: '本地', supplier: '建材公司', quantity: 2000, unit: '方', status: 'pending', statusText: '待审核', createTime: '2024-01-09' },
    { id: 8, name: '保温棉', spec: '50mm', brand: '欧文斯科宁', supplier: '保温材料厂', quantity: 100, unit: '卷', status: 'approved', statusText: '已通过', createTime: '2024-01-08' },
    { id: 9, name: '防水卷材', spec: 'SBS', brand: '东方雨虹', supplier: '防水材料公司', quantity: 80, unit: '卷', status: 'rejected', statusText: '已拒绝', createTime: '2024-01-07' },
    { id: 10, name: '防火涂料', spec: '饰面型', brand: '金隅', supplier: '防火材料厂', quantity: 60, unit: '桶', status: 'approved', statusText: '已通过', createTime: '2024-01-06' },
  ]

  const currentBusinessName = useMemo(() => {
    const comp = businessComponents.find(c => c.key === selectedBusinessComponent)
    if (!comp) return ''
    return comp.enName ? `${comp.name} ${comp.enName}` : comp.name
  }, [selectedBusinessComponent])

  function getUpdateTime(componentKey: string): string {
    return componentUpdateTimes[componentKey] || '2024-01-01 00:00'
  }

  const handleColumnConfirm = useCallback((fields: ColumnField[]) => {
    CompanyMessage.success(`已更新 ${fields.length} 列`)
  }, [])

  const handleSmartListColumnConfirm = useCallback((fields: ColumnField[]) => {
    CompanyMessage.success(`已更新 ${fields.length} 列`)
  }, [])

  const handleBaseInfoFieldChange = useCallback((field: string, value: any) => {
    if (field === 'domainName' && value) {
      setDemoBaseInfoFormData(prev => ({ ...prev, domainKey: (value as string).toLowerCase().replace(/\s+/g, '-') }))
    }
  }, [])

  const handleDemoFooterSubmit = useCallback(() => {
    setDemoFooterSubmitLoading(true)
    setTimeout(() => {
      setDemoFooterSubmitLoading(false)
      CompanyMessage.success('提交成功')
    }, 1000)
  }, [])

  const handleDemoFooterCancel = useCallback(() => {
    CompanyMessage.info('取消操作')
  }, [])

  const handleDemoDomainSubmit = useCallback(() => {
    setDemoDomainSubmitLoading(true)
    setTimeout(() => {
      setDemoDomainSubmitLoading(false)
      CompanyMessage.success('保存成功')
    }, 1000)
  }, [])

  const handleDemoDomainCancel = useCallback(() => {
    CompanyMessage.info('取消操作')
  }, [])

  const addDemoButton = useCallback(() => {
    setDemoButtons(prev => [...prev, { key: `btn${Date.now()}`, label: '新按钮', onClick: () => CompanyMessage.info('点击了新按钮') }])
  }, [])

  const removeDemoButton = useCallback((index: number) => {
    setDemoButtons(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateButtonLabel = useCallback((index: number, label: string) => {
    setDemoButtons(prev => prev.map((btn, i) => i === index ? { ...btn, label } : btn))
  }, [])

  const updateButtonConfirm = useCallback((index: number, confirm: boolean) => {
    setDemoButtons(prev => prev.map((btn, i) => i === index ? { ...btn, confirm } : btn))
  }, [])

  const businessMenuItems = useMemo(() => {
    return businessComponentGroups.map(group => ({
      type: 'group' as const,
      key: group.key,
      label: group.name,
      children: businessComponents
        .filter(c => c.group === group.key)
        .map(c => ({ key: c.key, label: c.name })),
    }))
  }, [])

  function startTokensDrag(e: React.MouseEvent) {
    setIsTokensDragging(true)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', onTokensDrag)
    document.addEventListener('mouseup', stopTokensDrag)
    e.preventDefault()
  }

  function onTokensDrag(e: MouseEvent) {
    if (!isTokensDragging) return
    const newWidth = window.innerWidth - e.clientX
    if (newWidth >= 100) {
      setTokensWidth(newWidth)
    }
  }

  function stopTokensDrag() {
    setIsTokensDragging(false)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', onTokensDrag)
    document.removeEventListener('mouseup', stopTokensDrag)
  }

  useEffect(() => {
    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onTokensDrag)
      document.removeEventListener('mouseup', stopTokensDrag)
    }
  }, [])

  const renderDemoContent = () => {
    switch (selectedBusinessComponent) {
      case 'action-cell':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
              <h4>基本用法</h4>
              <ActionCell buttons={demoButtons} maxVisible={demoMaxVisible} />
            </div>
            <div className="demo-code">
              <h4>使用示例</h4>
              <pre>{`<ActionCell\n  buttons={buttons}\n  maxVisible={${demoMaxVisible}}\n/>`}</pre>
            </div>
          </div>
        )

      case 'filter-form':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
              <h4>基本用法</h4>
              <FilterForm
                items={filterConfig}
                onSearch={(data) => CompanyMessage.info(`搜索条件: ${JSON.stringify(data)}`)}
                onReset={() => CompanyMessage.info('已重置筛选条件')}
              />
            </div>
          </div>
        )

      case 'page-title':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
              <h4>基本用法</h4>
              <PageTitle
                title={demoPageTitle}
                showBack={showPageTitleBack}
                titleSuffix={showPageTitleSuffix ? <Tag color="processing">{demoPageTitleSuffix}</Tag> : undefined}
                actions={showPageTitleActions ? (
                  <Space>
                    <CompanyButton>返回</CompanyButton>
                    <CompanyButton type="primary">保存</CompanyButton>
                  </Space>
                ) : undefined}
              />
            </div>
            <div className="demo-code">
              <h4>使用示例</h4>
              <pre>{'<PageTitle title="页面标题">\n  <Space>\n    <Button>次要操作</Button>\n    <Button type="primary">主要操作</Button>\n  </Space>\n</PageTitle>'}</pre>
            </div>
          </div>
        )

      case 'column-settings-panel':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
              <h4>基本用法</h4>
              <ColumnSettingsPanel
                fields={columnFields}
                defaultFields={columnFields}
                onConfirm={handleColumnConfirm}
              >
                <CompanyButton>列设置</CompanyButton>
              </ColumnSettingsPanel>
            </div>
            <div className="demo-code">
              <h4>使用示例</h4>
              <pre>{'<ColumnSettingsPanel\n  fields={columnFields}\n  defaultFields={defaultFields}\n  onConfirm={handleConfirm}\n>\n  <Button>列设置</Button>\n</ColumnSettingsPanel>'}</pre>
            </div>
          </div>
        )

      case 'list-page-template':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
              <h4>说明</h4>
              <p style={{ color: 'var(--ant-color-text-secondary)' }}>列表页模板，提供筛选、表格、分页等完整功能组合。</p>
              <p style={{ color: 'var(--ant-color-text-secondary)' }}>包含视图选择、视图保存、视图管理等功能。</p>
            </div>
          </div>
        )

      case 'smart-list-template':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
            </div>
            <div className="demo-section">
              <div className="smart-list-demo">
                <SmartListTemplate
                  title="材料列表"
                  fields={smartListFields}
                  dataSource={smartListData}
                  loading={false}
                  pagination={{ current: 1, pageSize: 10, total: 50 }}
                  toolbarActions={
                    <Space size={12}>
                      <CompanyButton type="primary" onClick={() => CompanyMessage.info('点击了新增')}>新增</CompanyButton>
                      <ColumnSettingsPanel
                        fields={smartListColumnFields}
                        defaultFields={smartListColumnFields}
                        excludeKeys={['action']}
                        onConfirm={handleSmartListColumnConfirm}
                      >
                        <div className="icon-only-btn">
                          <SvgIcon href="setting" size={16} />
                        </div>
                      </ColumnSettingsPanel>
                    </Space>
                  }
                  bodyCell={(column, record) => {
                    if (column.key === 'status') {
                      const tagColor = record.status === 'pending' ? 'orange' : record.status === 'approved' ? 'green' : 'red'
                      return <Tag color={tagColor}>{record.statusText as string}</Tag>
                    }
                    if (column.key === 'action') {
                      return (
                        <ActionCell
                          buttons={[
                            { key: 'edit', label: '编辑', onClick: () => CompanyMessage.info('编辑 ' + record.id) },
                            { key: 'delete', label: '删除', danger: true, onClick: () => CompanyMessage.info('删除 ' + record.id) },
                          ]}
                        />
                      )
                    }
                    return null
                  }}
                />
              </div>
            </div>
            <div className="demo-code">
              <h4>使用示例</h4>
              <pre>{'<SmartListTemplate\n  title="材料列表"\n  fields={fields}\n  dataSource={data}\n  loading={loading}\n  pagination={pagination}\n  toolbarActions={\n    <Button type="primary">新增</Button>\n  }\n/>'}</pre>
            </div>
          </div>
        )

      case 'section-title':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
              <h4>基本用法</h4>
              <SectionTitle title={demoSectionTitle} />
            </div>
            <div className="demo-code">
              <h4>使用示例</h4>
              <pre>{'<SectionTitle title="基础信息" />'}</pre>
            </div>
          </div>
        )

      case 'base-info-form':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
              <h4>基本用法</h4>
              <div style={{ background: 'var(--ant-color-bg-container)', padding: 16, borderRadius: 8 }}>
                <BaseInfoForm
                  value={demoBaseInfoFormData}
                  fields={demoBaseInfoFields}
                  layout="horizontal"
                  onChange={(val) => setDemoBaseInfoFormData(val)}
                  onFieldChange={handleBaseInfoFieldChange}
                />
              </div>
            </div>
            <div className="demo-code">
              <h4>使用示例</h4>
              <pre>{'<BaseInfoForm\n  value={formData}\n  fields={fields}\n  layout="horizontal"\n  onFieldChange={handleFieldChange}\n/>'}</pre>
            </div>
          </div>
        )

      case 'form-footer-actions':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
              <h4>基本用法</h4>
              <div style={{ position: 'relative', height: 80, background: 'var(--ant-color-bg-container)', borderRadius: 8, overflow: 'hidden' }}>
                <FormFooterActions
                  submitLoading={demoFooterSubmitLoading}
                  onSubmit={handleDemoFooterSubmit}
                  onCancel={handleDemoFooterCancel}
                />
              </div>
            </div>
            <div className="demo-code">
              <h4>使用示例</h4>
              <pre>{'<FormFooterActions\n  submitLoading={loading}\n  onSubmit={handleSubmit}\n  onCancel={handleCancel}\n/>'}</pre>
            </div>
          </div>
        )

      case 'form-page-template':
        return (
          <div className="component-demo">
            <div className="demo-section">
              <h3 className="component-title">{currentBusinessName}</h3>
              <div className="component-update-time">更新时间：{getUpdateTime(selectedBusinessComponent)}</div>
              <h4>基本用法</h4>
              <div style={{ minHeight: 400, background: 'var(--ant-color-bg-layout, #F5F5F5)', borderRadius: 4, overflow: 'hidden' }}>
                <FormPageTemplate
                  title={demoPageTitle}
                  showBack={demoShowBack}
                  loading={demoDomainPageLoading}
                  submitLoading={demoDomainSubmitLoading}
                  showFooter={demoShowFooter}
                  footerPosition={demoFooterPosition}
                  onSubmit={handleDemoDomainSubmit}
                  onCancel={handleDemoDomainCancel}
                >
                  <div>
                    <SectionTitle title="基础信息" />
                    <BaseInfoForm
                      value={demoFormData}
                      fields={demoFormFields}
                      layout="horizontal"
                      onChange={(val) => setDemoFormData(val)}
                    />
                    <SectionTitle title="关联材料" />
                    <BaseInfoForm
                      value={demoMaterialFormData}
                      fields={demoMaterialFormFields}
                      layout="horizontal"
                      onChange={(val) => setDemoMaterialFormData(val)}
                    />
                  </div>
                </FormPageTemplate>
              </div>
            </div>
            <div className="demo-code">
              <h4>使用示例</h4>
              <pre>{`<FormPageTemplate\n  title="编辑域"\n  showBack={true}\n  loading={loading}\n  submitLoading={submitLoading}\n  showFooter={true}\n  footerPosition="fixed"\n  onSubmit={handleSubmit}\n  onCancel={handleCancel}\n>\n  <div>\n    <SectionTitle title="基础信息" />\n    <BaseInfoForm\n      value={formData}\n      fields={fields}\n      layout="horizontal"\n    />\n  </div>\n</FormPageTemplate>`}</pre>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderConfigPanel = () => {
    switch (selectedBusinessComponent) {
      case 'action-cell':
        return (
          <Form layout="vertical">
            <Form.Item label="最大可见按钮数">
              <Select value={demoMaxVisible} onChange={setDemoMaxVisible}>
                <Select.Option value={1}>1</Select.Option>
                <Select.Option value={2}>2</Select.Option>
                <Select.Option value={3}>3</Select.Option>
                <Select.Option value={4}>4</Select.Option>
                <Select.Option value={5}>5</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="按钮配置">
              <Button type="dashed" onClick={addDemoButton} style={{ marginBottom: 8 }}>+ 添加按钮</Button>
              {demoButtons.map((btn, idx) => (
                <div key={idx} className="button-config">
                  <div className="button-config-row">
                    <Input value={btn.label} onChange={(e) => updateButtonLabel(idx, e.target.value)} placeholder="按钮文字" style={{ flex: 1 }} />
                  </div>
                  <div className="button-config-row" style={{ marginTop: 4 }}>
                    <Switch
                      checked={!!btn.confirm}
                      onChange={(checked) => updateButtonConfirm(idx, checked)}
                      checkedChildren="确认"
                      unCheckedChildren="无"
                    />
                    <Button type="link" danger onClick={() => removeDemoButton(idx)}>删除</Button>
                  </div>
                </div>
              ))}
            </Form.Item>
          </Form>
        )

      case 'page-title':
        return (
          <Form layout="vertical">
            <Form.Item label="标题文本">
              <Input value={demoPageTitle} onChange={(e) => setDemoPageTitle(e.target.value)} placeholder="请输入页面标题" />
            </Form.Item>
            <Form.Item label="显示返回区域">
              <Switch checked={showPageTitleBack} onChange={setShowPageTitleBack} />
            </Form.Item>
            <Form.Item label="显示标题后缀">
              <Switch checked={showPageTitleSuffix} onChange={setShowPageTitleSuffix} />
            </Form.Item>
            {showPageTitleSuffix && (
              <Form.Item label="标题后缀文本">
                <Input value={demoPageTitleSuffix} onChange={(e) => setDemoPageTitleSuffix(e.target.value)} placeholder="请输入标题后缀" />
              </Form.Item>
            )}
            <Form.Item label="显示操作按钮">
              <Switch checked={showPageTitleActions} onChange={setShowPageTitleActions} />
            </Form.Item>
          </Form>
        )

      case 'section-title':
        return (
          <Form layout="vertical">
            <Form.Item label="标题文本">
              <Input value={demoSectionTitle} onChange={(e) => setDemoSectionTitle(e.target.value)} placeholder="请输入标题" />
            </Form.Item>
          </Form>
        )

      case 'form-page-template':
        return (
          <Form layout="vertical">
            <Form.Item label="页面标题">
              <Input value={demoPageTitle} onChange={(e) => setDemoPageTitle(e.target.value)} placeholder="请输入页面标题" />
            </Form.Item>
            <Form.Item label="显示返回按钮">
              <Switch checked={demoShowBack} onChange={setDemoShowBack} />
            </Form.Item>
            <Form.Item label="显示底部操作栏">
              <Switch checked={demoShowFooter} onChange={setDemoShowFooter} />
            </Form.Item>
            <Form.Item label="底部操作栏位置">
              <Select value={demoFooterPosition} onChange={setDemoFooterPosition}>
                <Select.Option value="fixed">固定在底部</Select.Option>
                <Select.Option value="static">跟随内容</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        )

      default:
        return <div className="tokens-empty">暂无配置项</div>
    }
  }

  return (
    <div className="component-preview">
      <PageTitle title="主题设置" />

        <div className="components-layout" style={{ height: '100%' }}>
          <div className="components-nav" style={{ width: businessNavWidth }}>
            <Menu
              selectedKeys={[selectedBusinessComponent]}
              mode="inline"
              onClick={({ key }) => setSelectedBusinessComponent(key)}
              items={businessMenuItems}
            />
          </div>

          <div className="components-content">
            {renderDemoContent()}
          </div>

          <div className="components-divider" onMouseDown={startTokensDrag}>
            <div className="drag-handle" />
          </div>

          <div className="components-tokens" style={{ width: tokensWidth }}>
            <Tabs
              size="small"
              activeKey={businessTokenTabKey}
              onChange={setBusinessTokenTabKey}
              items={[
                {
                  key: 'config',
                  label: '配置',
                  children: <div className="config-panel">{renderConfigPanel()}</div>,
                },
              ]}
            />
          </div>
        </div>
    </div>
  )
}
