import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import {
  CompanyTable,
  CompanyButton,
  CompanyPagination,
  CompanyDropdown,
} from '@donglegeyu/company-ui'
import { Menu } from 'antd'
import FilterForm from './FilterForm'
import SvgIcon from './SvgIcon'
import type { FilterItem, FilterScheme, PaginationConfig } from '@/types'
import './ListPageTemplate.scss'

type RecordType = Record<string, unknown>

interface TableColumn {
  title: string
  dataIndex: string
  key?: string
  width?: number
  fixed?: 'left' | 'right'
  [key: string]: unknown
}

interface ListPageTemplateProps {
  title?: string
  filterItems?: FilterItem[]
  columns?: TableColumn[]
  dataSource?: RecordType[]
  loading?: boolean
  pagination?: PaginationConfig | false
  rowSelection?: object | null
  rowKey?: string | ((record: RecordType) => string)
  showViewSelector?: boolean
  viewSchemes?: FilterScheme[]
  currentViewId?: string
  viewDropdownText?: string
  showSchemeActions?: boolean
  showAddView?: boolean
  hasModified?: boolean
  hasSearched?: boolean
  filterParams?: Record<string, unknown>
  onFilterParamsChange?: (params: Record<string, unknown>) => void
  onSearch?: (data: Record<string, unknown>) => void
  onReset?: () => void
  onChange?: (data: Record<string, unknown>) => void
  onPaginationChange?: (pagination: { current: number; pageSize: number }) => void
  onViewChange?: (schemeId: string) => void
  onDefaultView?: () => void
  onEditScheme?: (data: { id: string; name: string }) => void
  onDeleteScheme?: (schemeId: string) => void
  onAddView?: () => void
  onSave?: () => void
  onSaveAs?: () => void
  titleActions?: ReactNode
  toolbarActions?: ReactNode
  bodyCellRender?: (column: TableColumn, record: RecordType) => ReactNode
}

export default function ListPageTemplate({
  title = '',
  filterItems = [],
  columns = [],
  dataSource = [],
  loading = false,
  pagination = { current: 1, pageSize: 20, total: 0 },
  rowSelection = null,
  rowKey = 'id',
  showViewSelector = false,
  viewSchemes = [],
  viewDropdownText = '默认视图',
  showSchemeActions = false,
  filterParams = {},
  onFilterParamsChange,
  onSearch,
  onReset,
  onChange,
  onPaginationChange,
  onViewChange,
  onDefaultView,
  onEditScheme,
  onDeleteScheme,
  onAddView,
  onSave,
  onSaveAs,
  titleActions,
  toolbarActions,
}: ListPageTemplateProps) {
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false)
  const [tableHeight, setTableHeight] = useState(400)
  const containerRef = useRef<HTMLDivElement>(null)

  const [paginationConfig, setPaginationConfig] = useState<PaginationConfig>(
    pagination !== false && typeof pagination === 'object'
      ? pagination
      : { current: 1, pageSize: 20, total: 0 }
  )

  useEffect(() => {
    if (pagination !== false && typeof pagination === 'object') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaginationConfig(pagination)
    }
  }, [pagination])

  const handleViewMenuClick = useCallback(
    (info: { key: string }) => {
      const key = String(info.key)
      if (key === 'default') {
        onDefaultView?.()
      } else if (key === 'add-view') {
        onAddView?.()
      } else {
        onViewChange?.(key)
      }
      setViewDropdownOpen(false)
    },
    [onDefaultView, onAddView, onViewChange]
  )

  const handleSearch = useCallback(
    (searchData: Record<string, unknown>) => {
      onSearch?.(searchData)
    },
    [onSearch]
  )

  const handleReset = useCallback(() => {
    onReset?.()
  }, [onReset])

  const handleTableChange = useCallback(
    (paginationChange: Record<string, unknown>) => {
      onChange?.(paginationChange)
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

  const updateTableHeight = useCallback(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const header = container.querySelector('.page-header')?.clientHeight || 0
    const filter = container.querySelector('.filter-form')?.clientHeight || 0
    const toolbar = container.querySelector('.toolbar')?.clientHeight || 0
    const paginationEl =
      container.querySelector('.pagination')?.clientHeight || 56
    const containerHeight = container.clientHeight || 0
    const used = header + filter + toolbar + paginationEl + 32
    setTableHeight(Math.max(300, containerHeight - used))
  }, [])

  useEffect(() => {
    updateTableHeight()
    window.addEventListener('resize', updateTableHeight)
    return () => window.removeEventListener('resize', updateTableHeight)
  }, [updateTableHeight])

  const viewDropdownItems = [
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
    ...viewSchemes.map((scheme) => ({
      key: scheme.id,
      label: (
        <div className="scheme-option">
          <span>{scheme.name}</span>
          <span
            style={{
              marginLeft: 0,
              fontSize: 12,
              color: 'rgba(0, 0, 0, 0.45)',
            }}
          >
            （{scheme.filterOrder?.length || 0}）
          </span>
          {showSchemeActions && (
            <span className="action-icons" style={{ marginLeft: 'auto' }}>
              <SvgIcon
                href="writing-fluently"
                size={16}
                className="action-icon edit-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditScheme?.({ id: scheme.id, name: scheme.name })
                }}
              />
              <span
                className="action-icon delete-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteScheme?.(scheme.id)
                }}
              >
                ✕
              </span>
            </span>
          )}
        </div>
      ),
    })),
    ...(showAddView
      ? [
          { type: 'divider' as const },
          {
            key: 'add-view',
            label: <span style={{ color: '#F95914' }}>+ 新增视图</span>,
          },
        ]
      : []),
  ]



  return (
    <div ref={containerRef} className="list-page-template">
      <div className="page-header">
        <h2 className="page-title">{title}</h2>
        <div className="page-header-actions">
          <div className="page-header-line" />
          {showViewSelector && (
            <>
              <CompanyDropdown
                open={viewDropdownOpen}
                onOpenChange={setViewDropdownOpen}
                popupRender={() => (
                  <Menu
                    onClick={handleViewMenuClick}
                    items={viewDropdownItems}
                    style={{ minWidth: 200 }}
                  />
                )}
              >
                <CompanyButton className="view-dropdown-btn">
                  {viewDropdownText}
                  <SvgIcon href="down" size={14} style={{ marginLeft: 4 }} />
                </CompanyButton>
              </CompanyDropdown>

              {hasModified && hasSearched && (
                <>
                  <CompanyButton
                    size="small"
                    className="save-filter-btn"
                    onClick={() => onSave?.()}
                  >
                    保存
                  </CompanyButton>
                  <CompanyButton
                    size="small"
                    className="save-filter-btn"
                    onClick={() => onSaveAs?.()}
                  >
                    另存为
                  </CompanyButton>
                </>
              )}
            </>
          )}
          {titleActions}
        </div>
      </div>

      {filterItems.length > 0 && (
        <FilterForm
          modelValue={filterParams}
          items={filterItems}
          onSearch={handleSearch}
          onReset={handleReset}
          onUpdateModelValue={onFilterParamsChange}
          onChange={onChange}
        />
      )}

      <div className="filter-gap" />

      <div className="content-card">
        <div className="toolbar">
          <div className="toolbar-left">{toolbarActions}</div>
        </div>

        <div className="table-wrapper">
          <CompanyTable
            dataSource={dataSource}
            columns={columns as object[]}
            loading={loading}
            pagination={false}
            scroll={{ y: tableHeight }}
            rowSelection={rowSelection as object | undefined}
            rowKey={rowKey}
            onChange={handleTableChange}
          />
        </div>

        {pagination !== false && (
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
    </div>
  )
}
