import { useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import {
  CompanyTable,
  CompanyButton,
  CompanyPagination,
  CompanyDropdown,
  CompanyDrawer,
  CompanyInput,
  CompanySelect,
  CompanyCheckbox,
  CompanyMessage,
} from '@donglegeyu/company-ui'
import { Menu } from 'antd'
import FilterForm from './FilterForm'
import SvgIcon from './SvgIcon'
import type {
  FieldDefinition,
  TreeConfig,
  FilterScheme,
  PaginationConfig,
} from '@/types'
import './SmartListTemplate.scss'

type RecordType = Record<string, unknown>

interface FilterOptionItem {
  key: string
  label: string
  checked: boolean
  defaultValue: unknown
  options?: { label: string; value: string | number }[]
  type?: string
  placeholder?: string
}

interface SmartListTemplateProps {
  title?: string
  fields?: FieldDefinition[]
  dataSource?: RecordType[]
  loading?: boolean
  pagination?: PaginationConfig | false
  rowSelection?: object | null
  rowKey?: string | ((record: RecordType) => string)
  viewEndpoint?: string
  defaultExpandAll?: boolean
  treeConfig?: TreeConfig
  filterParams?: Record<string, unknown>
  onFilterParamsChange?: (params: Record<string, unknown>) => void
  onSearch?: (data: Record<string, unknown>) => void
  onReset?: () => void
  onChange?: (data: Record<string, unknown>) => void
  onPaginationChange?: (pagination: { current: number; pageSize: number }) => void
  onViewChange?: (data: { schemeId: string; filters: Record<string, unknown> }) => void
  onExpand?: (data: { expanded: boolean; record: RecordType; expandedRowKeys: string[] }) => void
  titleActions?: ReactNode
  toolbarActions?: ReactNode
  toolbarRightActions?: ReactNode
  bodyCell?: (column: Record<string, unknown>, record: RecordType) => ReactNode
}

const nonBusinessFields = ['action', 'index', 'checkbox', 'selection']

function getCurrentUserId(): string {
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      return user.id || user.userId || 'default'
    }
  } catch {
    // ignore
  }
  return 'default'
}

export default function SmartListTemplate({
  title = '',
  fields = [],
  dataSource = [],
  loading = false,
  pagination = { current: 1, pageSize: 20, total: 0 },
  rowSelection = null,
  rowKey = 'id',
  viewEndpoint = '/api/views',
  defaultExpandAll = true,
  treeConfig = { enabled: false },
  filterParams = {},
  onFilterParamsChange,
  onSearch,
  onReset,
  onChange,
  onPaginationChange,
  onViewChange,
  onExpand,
  titleActions,
  toolbarActions,
  toolbarRightActions,
}: SmartListTemplateProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [saveSchemeDialogVisible, setSaveSchemeDialogVisible] = useState(false)
  const [newSchemeName, setNewSchemeName] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null)
  const [hasModified, setHasModified] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isRecordingBaseline, setIsRecordingBaseline] = useState(false)
  const [initializedFilterParams, setInitializedFilterParams] = useState<
    Record<string, unknown>
  >({})
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [currentScheme, setCurrentScheme] = useState('')
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [filterSchemes, setFilterSchemes] = useState<FilterScheme[]>([])
  const [dialogFilterOptions, setDialogFilterOptions] = useState<
    FilterOptionItem[]
  >([])
  const [paginationConfig, setPaginationConfig] = useState<PaginationConfig>(
    pagination !== false && typeof pagination === 'object'
      ? pagination
      : { current: 1, pageSize: 20, total: 0 }
  )
  const [tableHeight, setTableHeight] = useState(400)
  const [internalFilterParams, setInternalFilterParams] = useState<
    Record<string, unknown>
  >({})

  const effectiveFilterParams =
    Object.keys(filterParams).length > 0 ? filterParams : internalFilterParams

  const updateFilterParams = useCallback(
    (params: Record<string, unknown>) => {
      setInternalFilterParams(params)
      onFilterParamsChange?.(params)
    },
    [onFilterParamsChange]
  )

  useEffect(() => {
    if (
      pagination !== false &&
      typeof pagination === 'object'
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaginationConfig(pagination)
    }
  }, [pagination])

  useEffect(() => {
    if (!fields || fields.length === 0) return
    const updatedOptions: FilterOptionItem[] = fields
      .filter((field) => !nonBusinessFields.includes(field.key))
      .map((field) => {
        return {
          key: field.key,
          label: field.label,
          checked: false,
          defaultValue: '',
          options: field.options?.map((o) => ({
            label: o.label,
            value: o.value,
          })),
          type: field.type,
          placeholder: field.placeholder,
        }
      })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDialogFilterOptions(updatedOptions)
  }, [fields])

  const displayFilterItems = useMemo(() => {
    const filteredFields = fields.filter(
      (field) => !nonBusinessFields.includes(field.key)
    )

    if (!currentScheme || currentScheme === 'default') {
      return filteredFields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type || 'input',
        placeholder: f.placeholder,
        options: f.options,
      }))
    }

    const scheme = filterSchemes.find((s) => s.id === currentScheme)
    if (!scheme)
      return filteredFields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type || 'input',
        placeholder: f.placeholder,
        options: f.options,
      }))

    const filterOrder = scheme.filterOrder || []
    const schemeFields = filteredFields.filter((field) =>
      filterOrder.includes(field.key)
    )

    if (filterOrder.length > 0) {
      return schemeFields
        .sort((a, b) => {
          const indexA = filterOrder.indexOf(a.key)
          const indexB = filterOrder.indexOf(b.key)
          if (indexA === -1 && indexB === -1) return 0
          if (indexA === -1) return 1
          if (indexB === -1) return -1
          return indexA - indexB
        })
        .map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type || 'input',
          placeholder: f.placeholder,
          options: f.options,
        }))
    }

    return schemeFields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type || 'input',
      placeholder: f.placeholder,
      options: f.options,
    }))
  }, [fields, currentScheme, filterSchemes])

  const displayColumns = useMemo(() => {
    const regularFields = fields.filter((field) => field.key !== 'action')
    const actionField = fields.find((field) => field.key === 'action')

    const regularColumns: Record<string, unknown>[] = regularFields.map(
      (field) => ({
        title: field.label,
        dataIndex: field.key,
        key: field.key,
        width: field.width || 120,
        fixed: field.fixed,
      })
    )

    if (actionField) {
      regularColumns.push({
        title: '操作',
        dataIndex: actionField.key,
        key: 'action',
        width: actionField.width || 148,
        fixed: 'right',
      })
    }

    return regularColumns
  }, [fields])

  const loadSchemes = useCallback(async () => {
    try {
      const res = await fetch(viewEndpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const json = await res.json()
        if (json.code === 200) {
          setFilterSchemes(json.data || [])
        } else {
          CompanyMessage.error('视图配置加载失败，将使用默认视图')
          setFilterSchemes([])
        }
      } else {
        CompanyMessage.error('视图配置加载失败，将使用默认视图')
        setFilterSchemes([])
      }
    } catch {
      CompanyMessage.error('视图配置加载失败，将使用默认视图')
      setFilterSchemes([])
    }
  }, [viewEndpoint])

  const saveSchemeToApi = useCallback(
    async (scheme: FilterScheme) => {
      try {
        const res = await fetch(viewEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheme),
        })
        const json = await res.json()
        return json.code === 200
      } catch {
        return false
      }
    },
    [viewEndpoint]
  )

  const deleteSchemeFromApi = useCallback(
    async (schemeId: string) => {
      try {
        const res = await fetch(`${viewEndpoint}/${schemeId}`, {
          method: 'DELETE',
        })
        const json = await res.json()
        if (json.code === 200) {
          setFilterSchemes((prev) => prev.filter((s) => s.id !== schemeId))
          return true
        } else {
          CompanyMessage.error('删除视图失败，请稍后重试')
        }
        return false
      } catch {
        CompanyMessage.error('删除视图失败，请稍后重试')
        return false
      }
    },
    [viewEndpoint]
  )

  const handleSchemeChange = useCallback(
    (schemeId: string) => {
      setIsRecordingBaseline(true)
      setInitializedFilterParams({})
      setHasSearched(false)

      if (!schemeId || schemeId === 'default') {
        setCurrentScheme('default')
        updateFilterParams({})
        setDropdownOpen(false)
        setHasModified(false)
        setTimeout(() => setIsRecordingBaseline(false), 300)
        onViewChange?.({ schemeId: 'default', filters: {} })
        return
      }

      const scheme = filterSchemes.find((s) => s.id === schemeId)
      if (scheme) {
        const newParams: Record<string, unknown> = {}
        if (scheme.filterOrder) {
          scheme.filterOrder.forEach((key) => {
            if (scheme.filters && scheme.filters[key] !== undefined) {
              newParams[key] = scheme.filters[key]
            }
          })
        }
        updateFilterParams(newParams)
        setCurrentScheme(schemeId)
        setDropdownOpen(false)
        setHasModified(false)
        setTimeout(() => setIsRecordingBaseline(false), 300)
        onViewChange?.({ schemeId, filters: newParams })
      }
    },
    [filterSchemes, updateFilterParams, onViewChange]
  )

  const getDropdownButtonText = useCallback(() => {
    if (!currentScheme || currentScheme === 'default') return '默认视图'
    const scheme = filterSchemes.find((s) => s.id === currentScheme)
    return scheme ? scheme.name : '默认视图'
  }, [currentScheme, filterSchemes])

  const handleSave = useCallback(async () => {
    if (!currentScheme || currentScheme === 'default') {
      CompanyMessage.warning('请先选择一个视图再保存')
      return
    }
    const scheme = filterSchemes.find((s) => s.id === currentScheme)
    if (scheme) {
      const updatedScheme = {
        ...scheme,
        filters: { ...effectiveFilterParams },
      }
      const success = await saveSchemeToApi(updatedScheme)
      if (success) {
        CompanyMessage.success('保存成功')
        setHasModified(false)
        setHasSearched(false)
        setInitializedFilterParams(
          JSON.parse(JSON.stringify(effectiveFilterParams))
        )
      } else {
        CompanyMessage.error('保存失败，请重试')
      }
    }
  }, [
    currentScheme,
    filterSchemes,
    effectiveFilterParams,
    saveSchemeToApi,
  ])

  const handleEditScheme = useCallback(
    (schemeId: string) => {
      const scheme = filterSchemes.find((s) => s.id === schemeId)
      if (!scheme) return
      setDropdownOpen(false)
      setIsEditMode(true)
      setEditingSchemeId(schemeId)
      setNewSchemeName(scheme.name)
      updateFilterParams({ ...(scheme.filters || {}) })
      setDialogFilterOptions((prev) =>
        prev.map((opt) => {
          const isChecked = !!(
            scheme.filterOrder && scheme.filterOrder.includes(opt.key)
          )
          const defaultValue = scheme.filters?.[opt.key]
          return { ...opt, checked: isChecked, defaultValue }
        })
      )
      setSaveSchemeDialogVisible(true)
    },
    [filterSchemes, updateFilterParams]
  )

  const handleSaveAs = useCallback(() => {
    setDropdownOpen(false)
    setIsEditMode(false)
    setEditingSchemeId(null)
    setNewSchemeName('')
    setHasSearched(false)
    setDialogFilterOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        checked: false,
        defaultValue: effectiveFilterParams[opt.key] || '',
      }))
    )
    setSaveSchemeDialogVisible(true)
  }, [effectiveFilterParams])

  const handleDrawerClose = useCallback(() => {
    setNewSchemeName('')
    setSaveSchemeDialogVisible(false)
    setIsEditMode(false)
    setEditingSchemeId(null)
  }, [])

  const confirmSaveScheme = useCallback(async () => {
    if (!newSchemeName.trim()) {
      CompanyMessage.warning('请输入视图名称')
      return
    }
    if (newSchemeName.length > 8) {
      CompanyMessage.warning('视图名称不能超过8个字')
      return
    }
    const nameExists = filterSchemes.some(
      (s) => s.name === newSchemeName.trim() && s.id !== editingSchemeId
    )
    if (nameExists) {
      CompanyMessage.warning('视图名称已存在')
      return
    }
    const selectedCount = dialogFilterOptions.filter(
      (opt) => opt.checked
    ).length
    if (selectedCount === 0) {
      CompanyMessage.warning('请至少选择一个筛选条件')
      return
    }

    const selectedFilters: Record<string, unknown> = {}
    const filterOrder: string[] = []
    dialogFilterOptions.forEach((opt) => {
      if (opt.checked && !nonBusinessFields.includes(opt.key)) {
        selectedFilters[opt.key] = opt.defaultValue || ''
        filterOrder.push(opt.key)
      }
    })

    if (isEditMode && editingSchemeId) {
      const scheme = filterSchemes.find((s) => s.id === editingSchemeId)
      if (!scheme) {
        CompanyMessage.error('未找到要编辑的视图')
        return
      }
      const updatedScheme: FilterScheme = {
        ...scheme,
        name: newSchemeName.trim(),
        filters: selectedFilters,
        filterOrder,
      }
      const success = await saveSchemeToApi(updatedScheme)
      if (success) {
        CompanyMessage.success('保存成功')
        setCurrentScheme(scheme.id)
        setHasModified(false)
        handleDrawerClose()
      } else {
        CompanyMessage.error('保存失败，请重试')
      }
    } else {
      const scheme: FilterScheme = {
        id: Date.now().toString(),
        name: newSchemeName.trim(),
        filters: selectedFilters,
        createdAt: new Date().toISOString(),
        userId: getCurrentUserId(),
        filterOrder,
      }
      setFilterSchemes((prev) => [...prev, scheme])
      const success = await saveSchemeToApi(scheme)
      if (success) {
        CompanyMessage.success('保存成功')
        setCurrentScheme(scheme.id)
        setHasModified(false)
        handleDrawerClose()
      } else {
        CompanyMessage.error('保存失败，请重试')
      }
    }
  }, [
    newSchemeName,
    filterSchemes,
    editingSchemeId,
    dialogFilterOptions,
    isEditMode,
    saveSchemeToApi,
    handleDrawerClose,
  ])

  const handleDeleteScheme = useCallback(
    async (schemeId: string) => {
      const success = await deleteSchemeFromApi(schemeId)
      if (success) {
        if (currentScheme === schemeId) {
          setCurrentScheme('default')
        }
        CompanyMessage.success('删除成功')
      } else {
        CompanyMessage.error('删除失败，请重试')
      }
    },
    [deleteSchemeFromApi, currentScheme]
  )

  const handleDragStart = useCallback(
    (_event: React.DragEvent, index: number) => {
      setDragIndex(index)
    },
    []
  )

  const handleDragEnter = useCallback(
    (_event: React.DragEvent, index: number) => {
      if (dragIndex !== null && dragIndex !== index) {
        setDialogFilterOptions((prev) => {
          const newItems = [...prev]
          const [draggedItem] = newItems.splice(dragIndex, 1)
          newItems.splice(index, 0, draggedItem)
          return newItems
        })
        setDragIndex(index)
      }
    },
    [dragIndex]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent, index: number) => {
      event.preventDefault()
      if (dragIndex === null || dragIndex === index) return
      setDialogFilterOptions((prev) => {
        const items = [...prev]
        const dragItem = items[dragIndex]
        items.splice(dragIndex, 1)
        items.splice(index, 0, dragItem)
        return items
      })
      setDragIndex(null)
    },
    [dragIndex]
  )

  const handleDialogFilterChange = useCallback(
    (index: number, checked: boolean) => {
      setDialogFilterOptions((prev) =>
        prev.map((opt, i) => (i === index ? { ...opt, checked } : opt))
      )
    },
    []
  )

  const handleDefaultValueChange = useCallback(
    (index: number, val: unknown) => {
      setDialogFilterOptions((prev) =>
        prev.map((opt, i) =>
          i === index ? { ...opt, defaultValue: val } : opt
        )
      )
    },
    []
  )

  const handleSearch = useCallback(
    (searchData: Record<string, unknown>) => {
      setHasSearched(true)
      onSearch?.(searchData)
    },
    [onSearch]
  )

  const handleReset = useCallback(() => {
    setIsRecordingBaseline(true)
    if (!currentScheme || currentScheme === 'default') {
      updateFilterParams({})
    } else {
      const scheme = filterSchemes.find((s) => s.id === currentScheme)
      if (scheme) {
        updateFilterParams({ ...(scheme.filters || {}) })
      } else {
        updateFilterParams({})
      }
    }
    setHasModified(false)
    setHasSearched(false)
    onReset?.()
    setTimeout(() => setIsRecordingBaseline(false), 100)
  }, [currentScheme, filterSchemes, updateFilterParams, onReset])

  const handleFilterChange = useCallback(
    (data: Record<string, unknown>) => {
      onChange?.(data)
    },
    [onChange]
  )

  const handleTableChange = useCallback(
    (_pagination: unknown) => {
      onChange?.(_pagination as Record<string, unknown>)
    },
    [onChange]
  )

  const handlePageChange = useCallback(
    (page: number, pageSize: number) => {
      setPaginationConfig({ current: page, pageSize, total: paginationConfig.total })
      onPaginationChange?.({ current: page, pageSize })
    },
    [paginationConfig.total, onPaginationChange]
  )

  const handleExpand = useCallback(
    (expanded: boolean, record: RecordType) => {
      const key =
        typeof rowKey === 'function'
          ? rowKey(record)
          : (record[rowKey as string] as string)

      let newKeys: string[]
      if (expanded) {
        newKeys = expandedRowKeys.includes(key)
          ? expandedRowKeys
          : [...expandedRowKeys, key]
      } else {
        newKeys = expandedRowKeys.filter((k) => k !== key)
      }
      setExpandedRowKeys(newKeys)
      onExpand?.({ expanded, record, expandedRowKeys: newKeys })
    },
    [rowKey, expandedRowKeys, onExpand]
  )

  useEffect(() => {
    if (!isRecordingBaseline && hasSearched) {
      const allKeys = new Set([
        ...Object.keys(initializedFilterParams),
        ...Object.keys(effectiveFilterParams),
      ])
      const changed = Array.from(allKeys).some((key) => {
        return (
          JSON.stringify(initializedFilterParams[key]) !==
          JSON.stringify(effectiveFilterParams[key])
        )
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasModified(changed)
    }
    if (isRecordingBaseline) {
      setInitializedFilterParams(
        JSON.parse(JSON.stringify(effectiveFilterParams))
      )
    }
  }, [effectiveFilterParams, isRecordingBaseline, hasSearched, initializedFilterParams])

  const updateTableHeight = useCallback(() => {
    const header =
      document.querySelector('.page-header')?.clientHeight || 0
    const filter =
      document.querySelector('.filter-form')?.clientHeight || 0
    const toolbar =
      document.querySelector('.toolbar')?.clientHeight || 0
    const paginationEl =
      document.querySelector('.pagination')?.clientHeight || 56
    const container =
      document.querySelector('.smart-list-template')?.clientHeight || 0
    const used = header + filter + toolbar + paginationEl + 32
    setTableHeight(Math.max(300, container - used))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRecordingBaseline(true)
    setHasSearched(false)
    loadSchemes()
    setTimeout(() => setIsRecordingBaseline(false), 300)
    updateTableHeight()
    window.addEventListener('resize', updateTableHeight)
    return () => window.removeEventListener('resize', updateTableHeight)
  }, [loadSchemes, updateTableHeight])

  const dropdownMenuItems = useMemo(
    () => [
      {
        key: 'default',
        label: (
          <div className="scheme-option">
            <span>默认视图</span>
            <span style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
              （全量）
            </span>
          </div>
        ),
      },
      ...filterSchemes.map((scheme) => ({
        key: scheme.id,
        label: (
          <div className="scheme-option">
            <span>{scheme.name}</span>
            <span style={{ marginLeft: 0, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
              （{scheme.filterOrder?.length || 0}）
            </span>
            <span
              className="action-icons"
              style={{ marginLeft: 'auto' }}
            >
              <SvgIcon
                href="writing-fluently"
                size={14}
                className="action-icon edit-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditScheme(scheme.id)
                }}
              />
              <span
                className="action-icon delete-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteScheme(scheme.id)
                }}
              >
                ✕
              </span>
            </span>
          </div>
        ),
      })),
      { type: 'divider' as const },
      {
        key: 'add-view',
        label: <span style={{ color: '#F95914' }}>+ 新增视图</span>,
      },
    ],
    [filterSchemes, handleEditScheme, handleDeleteScheme]
  )

  const handleMenuClick = useCallback(
    (info: { key: string }) => {
      if (info.key === 'add-view') {
        handleSaveAs()
      } else {
        handleSchemeChange(info.key)
      }
    },
    [handleSchemeChange, handleSaveAs]
  )

  const paginationProp = useMemo(() => {
    if (pagination === false) return false
    return {
      ...paginationConfig,
      showTotal: (total: number) => `共 ${total} 条`,
      showSizeChanger: true,
      showQuickJumper: true,
    }
  }, [pagination, paginationConfig])

  return (
    <div className="smart-list-template">
      <div className="page-header">
        <h2 className="page-title">{title}</h2>
        <div className="page-header-actions">
          <div className="page-header-line" />
          <CompanyDropdown
            open={dropdownOpen}
            onOpenChange={setDropdownOpen}
            popupRender={() => (
              <Menu
                onClick={handleMenuClick}
                items={dropdownMenuItems}
                style={{ minWidth: 200 }}
              />
            )}
          >
            <CompanyButton
              size="small"
              type="text"
              className="dropdown-text-btn"
            >
              {getDropdownButtonText()}
              {hasModified && hasSearched && (
                <span className="modified-tag-inline">已修改</span>
              )}
              <SvgIcon
                href={dropdownOpen ? 'up' : 'down'}
                size={16}
                style={{ marginLeft: 4 }}
              />
            </CompanyButton>
          </CompanyDropdown>

          {hasModified && hasSearched && (
            <>
              <CompanyButton
                size="small"
                className="save-filter-btn"
                onClick={handleSave}
              >
                保存
              </CompanyButton>
              <CompanyButton
                size="small"
                className="save-filter-btn"
                onClick={handleSaveAs}
              >
                另存为
              </CompanyButton>
            </>
          )}

          {titleActions}
        </div>
      </div>

      {displayFilterItems.length > 0 && (
        <FilterForm
          modelValue={effectiveFilterParams}
          items={displayFilterItems}
          onSearch={handleSearch}
          onReset={handleReset}
          onChange={handleFilterChange}
          onUpdateModelValue={updateFilterParams}
        />
      )}

      <div className="filter-gap" />

      <div className="content-card">
        <div className="toolbar">
          <div className="toolbar-left">{toolbarActions}</div>
          <div className="toolbar-right">{toolbarRightActions}</div>
        </div>

        <div className="table-wrapper">
          <CompanyTable
            dataSource={dataSource}
            columns={displayColumns as object[]}
            loading={loading}
            pagination={false}
            scroll={{ y: tableHeight }}
            rowSelection={rowSelection as object | undefined}
            rowKey={rowKey}
            defaultExpandAllRows={
              treeConfig?.enabled ? defaultExpandAll : undefined
            }
            onChange={handleTableChange}
            onExpand={
              treeConfig?.enabled
                ? handleExpand
                : undefined
            }
          />
        </div>

        {paginationProp !== false && (
          <div className="pagination">
            <CompanyPagination
              current={paginationConfig.current}
              pageSize={paginationConfig.pageSize}
              total={paginationConfig.total}
              showTotal={(total) => `共 ${total} 条`}
              showSizeChanger
              showQuickJumper
              onChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <CompanyDrawer
        open={saveSchemeDialogVisible}
        title={isEditMode ? '编辑视图' : '新增视图'}
        size={380}
        onClose={handleDrawerClose}
        footer={
          <div style={{ textAlign: 'right' }}>
            <CompanyButton
              style={{ marginRight: 12 }}
              onClick={handleDrawerClose}
            >
              取消
            </CompanyButton>
            <CompanyButton type="primary" onClick={confirmSaveScheme}>
              保存
            </CompanyButton>
          </div>
        }
      >
        <div className="drawer-content">
          <div className="form-item">
            <div className="form-label">
              视图名称
              <span className="required-star">*</span>
            </div>
            <div className="input-with-count">
              <CompanyInput
                value={newSchemeName}
                onChange={(e) => setNewSchemeName(e.target.value)}
                placeholder="请输入8个字以内的视图名称"
                maxLength={8}
              />
              <span className="word-count">{newSchemeName.length}/8</span>
            </div>
          </div>

          <div className="form-item" style={{ marginTop: 32 }}>
            <div className="form-label">
              视图条件
              <span className="required-star">*</span>
            </div>
            <div className="filter-list-hint">
              勾选并调整视图条件顺序后保存
            </div>
            <div className="filter-list-container">
              {dialogFilterOptions.map((item, index) => (
                <div
                  key={item.key}
                  className={`filter-item-drawer${dragIndex === index ? ' dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <div className="filter-row">
                    <SvgIcon href="drag" size={12} className="drag-icon" />
                    <CompanyCheckbox
                      checked={item.checked}
                      onChange={(e) =>
                        handleDialogFilterChange(index, e.target.checked)
                      }
                    >
                      {item.label}
                    </CompanyCheckbox>
                  </div>
                  {item.checked && (
                    <div className="default-value-row">
                      {item.options ? (
                        <CompanySelect
                          value={item.defaultValue as string}
                          onChange={(val) =>
                            handleDefaultValueChange(index, val)
                          }
                          options={item.options}
                          placeholder="默认值"
                          style={{ width: '100%' }}
                          allowClear
                        />
                      ) : (
                        <CompanyInput
                          value={(item.defaultValue as string) || ''}
                          onChange={(e) =>
                            handleDefaultValueChange(index, e.target.value)
                          }
                          placeholder="默认值"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CompanyDrawer>
    </div>
  )
}
