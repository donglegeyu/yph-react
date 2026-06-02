import { useState, useCallback, useEffect, useMemo } from 'react'
import { Space, TreeSelect, Tree, Empty, Tag } from 'antd'
import type { DataNode } from 'antd/es/tree'
import {
  CompanyTable,
  CompanyButton,
  CompanyDrawer,
  CompanyInput,
  CompanySelect,
  CompanyInputNumber,
  CompanyForm,
  CompanyRadio,
  CompanyMessage,
  CompanyPopconfirm,
} from '@donglegeyu/company-ui'
import FilterForm from '@/components/FilterForm'
import ActionCell from '@/components/ActionCell'
import SvgIcon from '@/components/SvgIcon'
import { useAppStore } from '@/store/app'
import { API_ENDPOINTS } from '@/constants/api'
import type { FilterItem } from '@/types'

interface MenuTreeItem {
  id: number
  key: string
  label: string
  path?: string
  icon?: string
  status: number
  parentId: number | null
  sort?: number
  menuType?: string
  children?: MenuTreeItem[]
}

interface FlatMenuItem {
  id: number
  key: string
  label: string
  path?: string
  icon?: string
  status: number
  parentId: number | null
  sort?: number
  menuType: string
  level: number
  hasChildren: boolean
  show: boolean
  levelText: string
}

interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right'
}

interface MenuFormData {
  id: number | null
  key: string
  label: string
  path: string
  icon: string
  sort: number
  status: number
  parentId: string | null
  menuType: string
}

interface MenuFilterParams {
  label?: string
  menuType?: string
  status?: number | string
  path?: string
  key?: string
  sort?: number | string
  [key: string]: unknown
}

function getMenuType(key: string): string {
  if (key === 'home') return '系统菜单-上'
  if (key === 'favorites' || key === 'super-search') return '系统菜单-下'
  return '业务菜单'
}

function getLevelText(level: number): string {
  return { 0: '一级', 1: '二级', 2: '三级' }[level] || '三级'
}

function flattenTree(
  data: MenuTreeItem[],
  expandedKeys: string[],
  result: FlatMenuItem[] = [],
  level = 0,
  parentExpanded = true
): FlatMenuItem[] {
  for (const item of data) {
    const { children, ...rest } = item
    const hasChildren = !!(children && children.length)
    const shouldShow = parentExpanded
    const flat: FlatMenuItem = {
      ...rest,
      level,
      hasChildren,
      show: shouldShow,
      menuType: rest.menuType || getMenuType(rest.key),
      levelText: getLevelText(level),
    }
    result.push(flat)
    if (children?.length) {
      flattenTree(children, expandedKeys, result, level + 1, shouldShow && expandedKeys.includes(item.key))
    }
  }
  return result
}

function filterTree(data: MenuTreeItem[], params: MenuFilterParams): MenuTreeItem[] {
  const hasFilters = Object.values(params).some(v => v !== undefined && v !== null && v !== '')
  if (!hasFilters) return data

  const result: MenuTreeItem[] = []
  for (const item of data) {
    const labelMatch = !params.label || item.label?.includes(params.label)
    const typeMatch = !params.menuType || item.menuType === params.menuType
    const statusMatch = params.status === undefined || params.status === null || params.status === '' || item.status === Number(params.status)
    const pathMatch = !params.path || item.path?.includes(params.path)
    const keyMatch = !params.key || item.key?.includes(params.key)
    const sortMatch = !params.sort || params.sort === '' || Number(item.sort) === Number(params.sort)

    if (labelMatch && typeMatch && statusMatch && pathMatch && keyMatch && sortMatch) {
      result.push({ ...item, children: undefined })
    } else if (item.children?.length) {
      const childResults = filterTree(item.children, params)
      result.push(...childResults)
    }
  }
  return result
}

function buildMenuTree(items: MenuTreeItem[], excludeId?: number): DataNode[] {
  return items
    .filter(item => !(excludeId && item.id === excludeId))
    .map((item) => ({
      value: String(item.id),
      title: item.label,
      children: item.children ? buildMenuTree(item.children, excludeId) : undefined,
    }))
}

const STORAGE_KEY = 'menu-management-column-settings'

const DEFAULT_COLUMN_FIELDS: ColumnField[] = [
  { key: 'label', label: '菜单名称', visible: true, width: 280, fixed: 'left' },
  { key: 'level', label: '菜单层级', visible: true, width: 100 },
  { key: 'menuType', label: '菜单类型', visible: true, width: 120 },
  { key: 'status', label: '状态', visible: true, width: 80 },
  { key: 'icon', label: '图标', visible: true, width: 80 },
  { key: 'path', label: '路径', visible: true, width: 150 },
  { key: 'key', label: 'Key', visible: true, width: 150 },
  { key: 'sort', label: '排序', visible: true, width: 80 },
  { key: 'action', label: '操作', visible: false, width: 220 },
]

const menuTypeOptions = [
  { label: '业务菜单', value: '业务菜单' },
  { label: '系统菜单-上', value: '系统菜单-上' },
  { label: '系统菜单-下', value: '系统菜单-下' },
]

const filterItems: FilterItem[] = [
  { key: 'label', label: '菜单名称', type: 'input', placeholder: '请输入菜单名称' },
  { key: 'menuType', label: '菜单类型', type: 'select', options: menuTypeOptions },
  { key: 'status', label: '状态', type: 'select', options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
  { key: 'path', label: '路径', type: 'input', placeholder: '请输入路径' },
  { key: 'key', label: 'Key', type: 'input', placeholder: '请输入Key' },
]

export default function MenuManagement() {
  const appStore = useAppStore()
  const [loading, setLoading] = useState(false)
  const [rawMenuData, setRawMenuData] = useState<MenuTreeItem[]>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([])
  const [filterParams, setFilterParams] = useState<MenuFilterParams>({})
  const [allExpanded, setAllExpanded] = useState(false)
  const [columnFields, setColumnFields] = useState<ColumnField[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return DEFAULT_COLUMN_FIELDS
  })

  const [modalVisible, setModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [formData, setFormData] = useState<MenuFormData>({
    id: null, key: '', label: '', path: '', icon: '', sort: 0, status: 1, parentId: null, menuType: '业务菜单',
  })
  const [parentSearchValue, setParentSearchValue] = useState('')

  const [moveDrawerVisible, setMoveDrawerVisible] = useState(false)
  const [moveTargetRecord, setMoveTargetRecord] = useState<FlatMenuItem | null>(null)
  const [selectedMoveTargetId, setSelectedMoveTargetId] = useState<number | null>(null)
  const [moveExpandedKeys, setMoveExpandedKeys] = useState<string[]>([])
  const [moveTreeData, setMoveTreeData] = useState<DataNode[]>([])

  const filtered = useMemo(() => filterTree(rawMenuData, filterParams), [rawMenuData, filterParams])
  const dataSource = useMemo(() => flattenTree(filtered, expandedKeys), [filtered, expandedKeys])
  const visibleDataSource = useMemo(() => dataSource.filter(item => item.show !== false), [dataSource])

  const parentTreeData = useMemo(() => {
    const search = parentSearchValue.trim().toLowerCase()
    const excludeId = formData.id || undefined
    if (search) {
      const results: DataNode[] = []
      const collect = (items: MenuTreeItem[]) => {
        for (const item of items) {
          if (excludeId && item.id === excludeId) continue
          if (item.label.toLowerCase().includes(search)) {
            results.push({ value: String(item.id), title: item.label })
          }
          if (item.children) collect(item.children)
        }
      }
      collect(rawMenuData)
      return results
    }
    return buildMenuTree(rawMenuData, excludeId)
  }, [rawMenuData, parentSearchValue, formData.id])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API_ENDPOINTS.NAV_MENUS)
      const json = await res.json()
      if (json.code === 200) {
        setRawMenuData(json.data || [])
      } else {
        CompanyMessage.error('菜单数据加载失败，请稍后重试')
      }
    } catch {
      CompanyMessage.error('菜单数据加载失败，请稍后重试')
    }
    setLoading(false)
  }, [])

  const handleSearch = useCallback((data: Record<string, unknown>) => {
    setFilterParams(data as MenuFilterParams)
  }, [])

  const handleReset = useCallback(() => {
    setFilterParams({})
  }, [])

  const toggleExpand = useCallback((record: FlatMenuItem) => {
    setExpandedKeys(prev =>
      prev.includes(record.key) ? prev.filter(k => k !== record.key) : [...prev, record.key]
    )
  }, [])

  const toggleAllExpand = useCallback(() => {
    setAllExpanded(prev => !prev)
    if (allExpanded) {
      setExpandedKeys([])
    } else {
      setExpandedKeys(rawMenuData.map(item => item.key))
    }
  }, [allExpanded, rawMenuData])

  const handleModalCancel = useCallback(() => {
    setModalVisible(false)
  }, [])

  const handleAdd = useCallback(() => {
    setModalTitle('新增菜单')
    setFormData({ id: null, key: '', label: '', path: '', icon: '', sort: 0, status: 1, parentId: null, menuType: '业务菜单' })
    setModalVisible(true)
  }, [])

  const handleEdit = useCallback((record: FlatMenuItem) => {
    setModalTitle('编辑菜单')
    setFormData({
      id: record.id,
      key: record.key,
      label: record.label,
      path: record.path || '',
      icon: record.icon || '',
      sort: record.sort || 0,
      status: record.status,
      parentId: record.parentId ? String(record.parentId) : null,
      menuType: record.menuType,
    })
    setModalVisible(true)
  }, [])

  const handleAddChild = useCallback((record: FlatMenuItem) => {
    setModalTitle('新增下级菜单')
    setFormData({ id: null, key: '', label: '', path: '', icon: '', sort: 0, status: 1, parentId: String(record.id), menuType: '业务菜单' })
    setModalVisible(true)
  }, [])

  const handleModalOk = useCallback(async () => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id ? `${API_ENDPOINTS.NAV_MENUS}/${formData.id}` : API_ENDPOINTS.NAV_MENUS
      const submitData = { ...formData, parentId: formData.parentId ? Number(formData.parentId) : null }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(formData.id ? '更新成功' : '新增成功')
        setModalVisible(false)
        await fetchData()
        appStore.fetchMenus()
      } else {
        CompanyMessage.error(json.message || '操作失败')
      }
    } catch {
      CompanyMessage.error('操作失败')
    }
  }, [formData, fetchData, appStore])

  const handleToggleStatus = useCallback(async (record: FlatMenuItem, status: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.NAV_MENUS}/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...record, status }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(status === 1 ? '已启用' : '已禁用')
        fetchData()
        appStore.fetchMenus()
      } else {
        CompanyMessage.error(json.message || '操作失败')
      }
    } catch {
      CompanyMessage.error('操作失败')
    }
  }, [fetchData, appStore])

  const handleDelete = useCallback(async (record: FlatMenuItem) => {
    if (!record.id) return
    try {
      const res = await fetch(`${API_ENDPOINTS.NAV_MENUS}/${record.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('删除成功')
        fetchData()
        appStore.fetchMenus()
      } else {
        CompanyMessage.error(json.message || '删除失败')
      }
    } catch {
      CompanyMessage.error('删除失败')
    }
  }, [fetchData, appStore])

  const handleBatchEnable = useCallback(async () => {
    if (!selectedRowKeys.length) return
    try {
      const res = await fetch(API_ENDPOINTS.NAV_MENUS_BATCH_STATUS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedRowKeys, status: 1 }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(`已启用 ${selectedRowKeys.length} 个菜单`)
        setSelectedRowKeys([])
        fetchData()
        appStore.fetchMenus()
      } else {
        CompanyMessage.error(json.message || '操作失败')
      }
    } catch {
      CompanyMessage.error('操作失败')
    }
  }, [selectedRowKeys, fetchData, appStore])

  const handleBatchDisable = useCallback(async () => {
    if (!selectedRowKeys.length) return
    try {
      const res = await fetch(API_ENDPOINTS.NAV_MENUS_BATCH_STATUS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedRowKeys, status: 0 }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(`已禁用 ${selectedRowKeys.length} 个菜单`)
        setSelectedRowKeys([])
        fetchData()
        appStore.fetchMenus()
      } else {
        CompanyMessage.error(json.message || '操作失败')
      }
    } catch {
      CompanyMessage.error('操作失败')
    }
  }, [selectedRowKeys, fetchData, appStore])

  const handleBatchDelete = useCallback(async () => {
    if (!selectedRowKeys.length) return
    try {
      const res = await fetch(API_ENDPOINTS.NAV_MENUS_BATCH, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedRowKeys }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(`已删除 ${selectedRowKeys.length} 个菜单`)
        setSelectedRowKeys([])
        fetchData()
        appStore.fetchMenus()
      } else {
        CompanyMessage.error(json.message || '删除失败')
      }
    } catch {
      CompanyMessage.error('删除失败')
    }
  }, [selectedRowKeys, fetchData, appStore])

  const openMoveDrawer = useCallback((record: FlatMenuItem) => {
    setMoveTargetRecord(record)
    setSelectedMoveTargetId(null)
    setMoveExpandedKeys(rawMenuData.map(item => String(item.id)))
    setMoveTreeData(buildMoveTreeData(record, rawMenuData))
    setMoveDrawerVisible(true)
  }, [rawMenuData])

  const closeMoveDrawer = useCallback(() => {
    setMoveDrawerVisible(false)
    setMoveTargetRecord(null)
    setSelectedMoveTargetId(null)
    setMoveTreeData([])
    setMoveExpandedKeys([])
  }, [])

  const confirmMove = useCallback(async () => {
    if (!moveTargetRecord || selectedMoveTargetId === null) return
    if (moveTargetRecord.parentId === selectedMoveTargetId) {
      CompanyMessage.info('菜单已在目标位置')
      return
    }
    try {
      const res = await fetch(`${API_ENDPOINTS.NAV_MENUS}/${moveTargetRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...moveTargetRecord, parentId: selectedMoveTargetId }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('移动成功')
        closeMoveDrawer()
        fetchData()
      } else {
        CompanyMessage.error(json.message || '移动失败')
      }
    } catch {
      CompanyMessage.error('移动失败')
    }
  }, [moveTargetRecord, selectedMoveTargetId, closeMoveDrawer, fetchData])

  const onSelectChange = useCallback((keys: (string | number)[]) => {
    setSelectedRowKeys(keys)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getActionButtons = useCallback((record: FlatMenuItem) => {
    const buttons: { key: string; label: string; danger?: boolean; confirm?: boolean; confirmTitle?: string; onClick: () => void }[] = [
      { key: 'edit', label: '编辑', onClick: () => handleEdit(record) },
    ]
    if (record.status === 1) {
      buttons.push({ key: 'disable', label: '禁用', onClick: () => handleToggleStatus(record, 0) })
    } else {
      buttons.push({ key: 'enable', label: '启用', onClick: () => handleToggleStatus(record, 1) })
    }
    if (record.level < 2) {
      buttons.push({ key: 'addChild', label: '新增下级', onClick: () => handleAddChild(record) })
    }
    buttons.push({ key: 'move', label: '移动', onClick: () => openMoveDrawer(record) })
    if (record.menuType !== '系统菜单-上') {
      buttons.push({ key: 'delete', label: '删除', danger: true, confirm: true, confirmTitle: '确定删除？', onClick: () => handleDelete(record) })
    }
    return buttons
  }, [handleEdit, handleToggleStatus, handleAddChild, openMoveDrawer, handleDelete])

  const visibleColumns = useMemo(() => {
    return columnFields
      .filter(f => f.visible)
      .map(f => ({
        title: f.key === 'label' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span
              onClick={toggleAllExpand}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 12, color: '#595959', marginRight: 6 }}
              title={allExpanded ? '收起全部' : '展开全部'}
            >
              {allExpanded ? '−' : '+'}
            </span>
            <span>{f.label}</span>
          </span>
        ) : f.label,
        dataIndex: f.key,
        key: f.key,
        width: f.width,
        fixed: f.fixed,
        render: f.key === 'label' ? (_: unknown, record: FlatMenuItem) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', paddingLeft: (record.level || 0) * 16 }}>
            {record.hasChildren ? (
              <span
                onClick={() => toggleExpand(record)}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 12, color: '#595959', marginRight: 6, flexShrink: 0, boxSizing: 'border-box' }}
              >
                {expandedKeys.includes(record.key) ? '−' : '+'}
              </span>
            ) : (
              <span style={{ display: 'inline-block', width: 16, height: 16, flexShrink: 0, marginRight: 6 }} />
            )}
            <span style={{ whiteSpace: 'nowrap' }}>{record.label}</span>
          </span>
        ) : f.key === 'status' ? (_: unknown, record: FlatMenuItem) => (
          <Tag color={record.status === 1 ? 'success' : 'default'}>
            {record.status === 1 ? '启用' : '禁用'}
          </Tag>
        ) : f.key === 'level' ? (_: unknown, record: FlatMenuItem) => (
          <>{record.levelText}</>
        ) : f.key === 'icon' ? (_: unknown, record: FlatMenuItem) => (
          record.icon && record.level !== 2 ? (
            <div className="icon-cell">
              <SvgIcon href={record.icon} size={16} />
            </div>
          ) : <>-</>
        ) : f.key === 'path' ? (_: unknown, record: FlatMenuItem) => (
          <>{record.path || '-'}</>
        ) : f.key === 'action' ? (_: unknown, record: FlatMenuItem) => (
          <ActionCell buttons={getActionButtons(record)} />
        ) : undefined,
      }))
  }, [columnFields, toggleAllExpand, allExpanded, expandedKeys, toggleExpand, getActionButtons])

  return (
    <div className="smart-list-template">
      <div className="page-header">
        <h2 className="page-title">菜单管理</h2>
        <div className="page-header-actions" />
      </div>

      <FilterForm
        modelValue={filterParams as Record<string, unknown>}
        items={filterItems}
        onSearch={handleSearch}
        onReset={handleReset}
        onUpdateModelValue={(data) => setFilterParams(data as MenuFilterParams)}
      />

      <div className="filter-gap" />

      <div className="content-card">
        <div className="toolbar">
          <div className="toolbar-left">
            <Space size={12}>
              <CompanyButton type="primary" onClick={handleAdd}>新增菜单</CompanyButton>
              <CompanyButton onClick={handleBatchEnable} disabled={!selectedRowKeys.length}>批量启用</CompanyButton>
              <CompanyButton onClick={handleBatchDisable} disabled={!selectedRowKeys.length}>批量禁用</CompanyButton>
              <CompanyPopconfirm title="确定删除选中的菜单？" onConfirm={handleBatchDelete}>
                <CompanyButton danger disabled={!selectedRowKeys.length}>
                  批量删除 ({selectedRowKeys.length})
                </CompanyButton>
              </CompanyPopconfirm>
              <CompanyButton
                onClick={() => setColumnFields(JSON.parse(JSON.stringify(DEFAULT_COLUMN_FIELDS)))}
                style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                <SvgIcon href="setting" size={16} />
              </CompanyButton>
              <CompanyButton
                onClick={fetchData}
                style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                <SvgIcon href="refresh" size={16} />
              </CompanyButton>
            </Space>
          </div>
        </div>

        <div className="table-wrapper" style={{ flex: 1, overflow: 'auto' }}>
          <CompanyTable
            dataSource={visibleDataSource}
            columns={visibleColumns}
            loading={loading}
            pagination={false}
            scroll={{ y: 'calc(100vh - 320px)' }}
            size="middle"
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: onSelectChange,
            }}
          />
        </div>
      </div>

      <CompanyDrawer
        open={modalVisible}
        title={modalTitle}
        size={360}
        onClose={handleModalCancel}
        footer={
          <Space>
            <CompanyButton onClick={handleModalCancel}>取消</CompanyButton>
            <CompanyButton type="primary" onClick={handleModalOk}>确定</CompanyButton>
          </Space>
        }
      >
        <CompanyForm layout="vertical">
          <CompanyForm.Item label="菜单Key">
            <CompanyInput
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              placeholder="如: material-center"
            />
          </CompanyForm.Item>
          <CompanyForm.Item label="菜单名称">
            <CompanyInput
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="如: 材料中心"
            />
          </CompanyForm.Item>
          <CompanyForm.Item label="路径">
            <CompanyInput
              value={formData.path}
              onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
              placeholder="如: /materials"
            />
          </CompanyForm.Item>
          <CompanyForm.Item label="上级菜单">
            <TreeSelect
              value={formData.parentId}
              onChange={(val) => setFormData(prev => ({ ...prev, parentId: val }))}
              treeData={parentTreeData}
              placeholder="选择上级菜单（留空为一级菜单）"
              allowClear
              showSearch
              treeDefaultExpandAll
              onSearch={(val) => setParentSearchValue(val)}
              filterTreeNode={(input, node) =>
                (node.title as string)?.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            />
          </CompanyForm.Item>
          <CompanyForm.Item label="图标">
            <CompanyInput
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="图标标识"
            />
          </CompanyForm.Item>
          <CompanyForm.Item label="菜单类型">
            <CompanySelect
              value={formData.menuType}
              onChange={(val) => setFormData(prev => ({ ...prev, menuType: val as string }))}
              options={menuTypeOptions}
              placeholder="请选择菜单类型"
            />
          </CompanyForm.Item>
          <CompanyForm.Item label="排序">
            <CompanyInputNumber
              value={formData.sort}
              onChange={(val) => setFormData(prev => ({ ...prev, sort: val || 0 }))}
              min={0}
              style={{ width: '100%' }}
            />
          </CompanyForm.Item>
          <CompanyForm.Item label="状态">
            <CompanyRadio.Group
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <CompanyRadio value={1}>启用</CompanyRadio>
              <CompanyRadio value={0}>禁用</CompanyRadio>
            </CompanyRadio.Group>
          </CompanyForm.Item>
        </CompanyForm>
      </CompanyDrawer>

      <CompanyDrawer
        open={moveDrawerVisible}
        title="移动菜单"
        size={420}
        onClose={closeMoveDrawer}
        footer={
          <Space>
            <CompanyButton onClick={closeMoveDrawer}>取消</CompanyButton>
            <CompanyButton
              type="primary"
              onClick={confirmMove}
              disabled={selectedMoveTargetId === null}
            >
              确认移动
            </CompanyButton>
          </Space>
        }
      >
        {moveTargetRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: 16, color: 'rgba(0,0,0,0.45)' }}>
              将「{moveTargetRecord.label}」移动至：
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {moveTreeData.length > 0 ? (
                <Tree
                  treeData={moveTreeData}
                  expandedKeys={moveExpandedKeys}
                  selectedKeys={selectedMoveTargetId !== null ? [String(selectedMoveTargetId)] : []}
                  blockNode
                  selectable
                  showIcon={false}
                  onSelect={(keys) => {
                    if (keys.length > 0) {
                      setSelectedMoveTargetId(Number(keys[0]))
                    }
                  }}
                  onExpand={(keys) => setMoveExpandedKeys(keys as string[])}
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </div>
          </div>
        )}
      </CompanyDrawer>
    </div>
  )
}

function buildMoveTreeData(record: FlatMenuItem, rawMenuData: MenuTreeItem[]): DataNode[] {
  const targetId = record.id
  const targetIdStr = String(record.id)

  const getDescendantIds = (node: MenuTreeItem): string[] => {
    const ids: string[] = [String(node.id)]
    if (node.children?.length) {
      for (const child of node.children) ids.push(...getDescendantIds(child))
    }
    return ids
  }

  const findRecordNode = (items: MenuTreeItem[]): MenuTreeItem | null => {
    for (const item of items) {
      if (item.id === targetId || String(item.id) === targetIdStr) return item
      if (item.children?.length) {
        const found = findRecordNode(item.children)
        if (found) return found
      }
    }
    return null
  }

  const recordNode = findRecordNode(rawMenuData)
  const excludedIds = recordNode ? getDescendantIds(recordNode) : [targetIdStr]

  const buildLevelMap = (items: MenuTreeItem[], currentLevel = 0, map: Map<string, number> = new Map()): Map<string, number> => {
    for (const item of items) {
      map.set(String(item.id), currentLevel)
      if (item.children?.length) buildLevelMap(item.children, currentLevel + 1, map)
    }
    return map
  }
  const levelMap = buildLevelMap(rawMenuData)

  const getSubTreeDepth = (node: MenuTreeItem): number => {
    if (!node.children?.length) return 0
    let maxChildDepth = 0
    for (const child of node.children) {
      maxChildDepth = Math.max(maxChildDepth, getSubTreeDepth(child))
    }
    return 1 + maxChildDepth
  }

  const maxSubLevel = recordNode ? getSubTreeDepth(recordNode) : 0

  const traverse = (items: MenuTreeItem[]): DataNode[] => {
    const nodes: DataNode[] = []
    for (const item of items) {
      const itemIdStr = String(item.id)
      if (excludedIds.includes(itemIdStr)) continue
      const isBizMenu = !item.menuType || item.menuType === '业务菜单'
      if (!isBizMenu) continue
      const targetMenuLevel = levelMap.get(itemIdStr) ?? 0
      const wouldExceed = targetMenuLevel + 1 + maxSubLevel > 2
      nodes.push({
        key: itemIdStr,
        title: wouldExceed ? (
          <span><span style={{ color: 'rgba(0,0,0,0.25)' }}>{item.label}</span><span style={{ color: '#999', fontSize: 12, marginLeft: 4 }}>（超出层级）</span></span>
        ) : item.label,
        selectable: !wouldExceed,
      })
    }
    return nodes
  }
  return traverse(rawMenuData)
}
