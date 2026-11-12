import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TableColumnsType } from 'antd'
import {
  CompanyButton,
  CompanyEmpty,
  CompanyInput,
  CompanyMessage,
  CompanySegmented,
  CompanySpin,
  CompanySwitch,
  CompanyTable,
  CompanyTabs,
  CompanyTag,
  CompanyTree,
  PageTitle,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import DbRelationGraph from './DbRelationGraph'
import './BackendDataManagement.scss'

interface DbMetaSummary {
  tableCount: number
  columnCount: number
  commentedColumnCount: number
  commentRate: number
  foreignKeyCount: number
  inferredRelationCount: number
  manualRelationCount: number
  hiddenTableCount: number
}

interface DbMetaTable {
  tableName: string
  displayName: string
  tableComment: string
  customDisplayName: boolean
  groupName: string
  hidden: boolean
  columnCount: number
  rowCount: number
}

interface DbMetaColumn {
  columnName: string
  columnType: string
  dataType: string
  nullable: boolean
  columnDefault: string | null
  comment: string
  primaryKey: boolean
  extra: string
  relationTarget: string | null
  relationSource: string | null
}

interface DbMetaIndex {
  indexName: string
  unique: boolean
  primary: boolean
  columns: string[]
}

interface DbMetaRelation {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  source: string
  confidence: string
  relationType: string
  label: string | null
  fromTableLabel: string
  toTableLabel: string
}

interface DbMetaTableDetail {
  table: DbMetaTable
  columns: DbMetaColumn[]
  indexes: DbMetaIndex[]
  outgoing: DbMetaRelation[]
  incoming: DbMetaRelation[]
}

type RelationRow = DbMetaRelation & { direction: '出' | '入' }

const SOURCE_LABEL: Record<string, { text: string; color: string }> = {
  fk: { text: '外键', color: 'success' },
  convention: { text: '命名推断', color: 'processing' },
  manual: { text: '人工维护', color: 'purple' },
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
  if (!response.ok) {
    throw new Error(`请求失败：HTTP ${response.status}`)
  }
  const json = await response.json()
  if (json.code !== 200) {
    throw new Error(json.message || '请求失败')
  }
  return json.data as T
}

export default function BackendDataManagement() {
  const [summary, setSummary] = useState<DbMetaSummary | null>(null)
  const [tables, setTables] = useState<DbMetaTable[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [includeHidden, setIncludeHidden] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [detail, setDetail] = useState<DbMetaTableDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [relations, setRelations] = useState<DbMetaRelation[] | null>(null)
  const [relationsLoading, setRelationsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'structure' | 'graph'>('structure')
  const [graphScope, setGraphScope] = useState<'all' | 'core' | 'manual'>('all')

  const loadOverview = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryData, tableData] = await Promise.all([
        getJson<DbMetaSummary>(API_ENDPOINTS.DB_META_SUMMARY),
        getJson<DbMetaTable[]>(`${API_ENDPOINTS.DB_META_TABLES}?includeHidden=true`),
      ])
      setSummary(summaryData)
      setTables(tableData)
      setSelectedTable((current) => current ?? tableData.find((t) => !t.hidden)?.tableName ?? null)
    } catch (error) {
      CompanyMessage.error(error instanceof Error ? error.message : '加载数据表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    if (!selectedTable) {
      setDetail(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    getJson<DbMetaTableDetail>(`${API_ENDPOINTS.DB_META_TABLES}/${encodeURIComponent(selectedTable)}`)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          CompanyMessage.error(error instanceof Error ? error.message : '加载表结构失败')
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedTable])

  useEffect(() => {
    if (viewMode !== 'graph' || relations !== null) return
    setRelationsLoading(true)
    getJson<DbMetaRelation[]>(API_ENDPOINTS.DB_META_RELATIONS)
      .then(setRelations)
      .catch((error: unknown) => {
        CompanyMessage.error(error instanceof Error ? error.message : '加载关系数据失败')
      })
      .finally(() => setRelationsLoading(false))
  }, [viewMode, relations])

  const filteredTables = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return tables.filter((table) => {
      if (!includeHidden && table.hidden) return false
      if (!kw) return true
      return (
        table.tableName.toLowerCase().includes(kw) ||
        table.displayName.toLowerCase().includes(kw) ||
        (table.tableComment ?? '').toLowerCase().includes(kw)
      )
    })
  }, [tables, keyword, includeHidden])

  const treeData = useMemo(() => {
    const groups = new Map<string, DbMetaTable[]>()
    filteredTables.forEach((table) => {
      const list = groups.get(table.groupName) ?? []
      list.push(table)
      groups.set(table.groupName, list)
    })
    return Array.from(groups.entries()).map(([groupName, list]) => ({
      key: `group:${groupName}`,
      title: `${groupName} · ${list.length}`,
      selectable: false,
      children: list.map((table) => ({
        key: `table:${table.tableName}`,
        isLeaf: true,
        title: (
          <span className="db-meta-tree-item">
            <span className="db-meta-tree-label">{table.displayName}</span>
            <span className="db-meta-tree-name">{table.tableName}</span>
          </span>
        ),
      })),
    }))
  }, [filteredTables])

  const graphTables = useMemo(() => {
    const base = tables.filter((table) => includeHidden || !table.hidden)
    if (graphScope === 'all') return base
    if (graphScope === 'core') return base.filter((table) => table.groupName === '系统权限')
    const names = new Set<string>()
    ;(relations ?? [])
      .filter((relation) => relation.source === 'manual')
      .forEach((relation) => {
        names.add(relation.fromTable)
        names.add(relation.toTable)
      })
    return base.filter((table) => names.has(table.tableName))
  }, [tables, includeHidden, graphScope, relations])

  const graphRelations = useMemo(() => {
    const list = relations ?? []
    return graphScope === 'manual' ? list.filter((relation) => relation.source === 'manual') : list
  }, [relations, graphScope])

  const relationRows: RelationRow[] = useMemo(() => {
    if (!detail) return []
    return [
      ...detail.outgoing.map((relation) => ({ ...relation, direction: '出' as const })),
      ...detail.incoming.map((relation) => ({ ...relation, direction: '入' as const })),
    ]
  }, [detail])

  const columnColumns: TableColumnsType<DbMetaColumn> = [
    {
      title: '字段名',
      dataIndex: 'columnName',
      width: 175,
      render: (value: string, record) => (
        <span className="db-meta-column-name">
          {value}
          {record.primaryKey && <CompanyTag color="gold">PK</CompanyTag>}
        </span>
      ),
    },
    { title: '类型', dataIndex: 'columnType', width: 120 },
    {
      title: '可空',
      dataIndex: 'nullable',
      width: 56,
      render: (value: boolean) => (value ? '是' : '否'),
    },
    {
      title: '默认值',
      dataIndex: 'columnDefault',
      width: 120,
      render: (value: string | null) => (value === null || value === '' ? '-' : value),
    },
    {
      title: '注释',
      dataIndex: 'comment',
      render: (value: string) => value || <span className="db-meta-muted">未填写</span>,
    },
    {
      title: '关联',
      dataIndex: 'relationTarget',
      width: 185,
      render: (value: string | null, record) =>
        value ? (
          <span className="db-meta-relation-cell">
            <span className="db-meta-relation-target">{value}</span>
            <CompanyTag color={SOURCE_LABEL[record.relationSource ?? '']?.color ?? 'default'}>
              {SOURCE_LABEL[record.relationSource ?? '']?.text ?? record.relationSource}
            </CompanyTag>
          </span>
        ) : (
          <span className="db-meta-muted">-</span>
        ),
    },
  ]

  const indexColumns: TableColumnsType<DbMetaIndex> = [
    {
      title: '索引名',
      dataIndex: 'indexName',
      width: 220,
      render: (value: string) => <span className="db-meta-column-name">{value}</span>,
    },
    {
      title: '类型',
      dataIndex: 'indexName',
      width: 110,
      render: (_: string, record) => {
        if (record.primary) return <CompanyTag color="gold">主键</CompanyTag>
        if (record.unique) return <CompanyTag color="blue">唯一</CompanyTag>
        return <CompanyTag>普通</CompanyTag>
      },
    },
    {
      title: '字段',
      dataIndex: 'columns',
      render: (value: string[]) => value.join(' , '),
    },
  ]

  const relationColumns: TableColumnsType<RelationRow> = [
    {
      title: '方向',
      dataIndex: 'direction',
      width: 80,
      render: (value: '出' | '入') => (
        <CompanyTag color={value === '出' ? 'blue' : 'purple'}>{value}边</CompanyTag>
      ),
    },
    {
      title: '关系字段',
      dataIndex: 'fromColumn',
      width: 360,
      render: (_: string, record) => (
        <span className="db-meta-relation-target">
          {record.fromTable}.{record.fromColumn} → {record.toTable}.{record.toColumn}
        </span>
      ),
    },
    {
      title: '关联表',
      dataIndex: 'toTable',
      render: (_: string, record) => {
        const isOutgoing = record.direction === '出'
        const tableName = isOutgoing ? record.toTable : record.fromTable
        return (
          <CompanyButton
            type="link"
            size="small"
            onClick={() => setSelectedTable(tableName)}
          >
            {isOutgoing ? record.toTableLabel : record.fromTableLabel}（{tableName}）
          </CompanyButton>
        )
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 110,
      render: (value: string) => (
        <CompanyTag color={SOURCE_LABEL[value]?.color ?? 'default'}>
          {SOURCE_LABEL[value]?.text ?? value}
        </CompanyTag>
      ),
    },
    {
      title: '说明',
      dataIndex: 'label',
      render: (value: string | null) =>
        value || <span className="db-meta-muted">-</span>,
    },
  ]

  const renderDetail = () => {
    if (!selectedTable) {
      return <CompanyEmpty description="请选择左侧数据表" />
    }
    if (detailLoading && !detail) {
      return (
        <div className="db-meta-loading">
          <CompanySpin />
        </div>
      )
    }
    if (!detail) {
      return <CompanyEmpty description="暂无表结构数据" />
    }
    return (
      <div className="db-meta-detail">
        <div className="db-meta-detail-head">
          <div className="db-meta-detail-title">
            <span>{detail.table.displayName}</span>
            <code>{detail.table.tableName}</code>
            {detail.table.hidden && <CompanyTag>内部表</CompanyTag>}
          </div>
          <div className="db-meta-detail-stats">
            <span>字段 {detail.columns.length}</span>
            <span>索引 {detail.indexes.length}</span>
            <span>出边 {detail.outgoing.length}</span>
            <span>入边 {detail.incoming.length}</span>
            <span>约 {detail.table.rowCount} 行</span>
          </div>
        </div>
        <CompanyTabs
          className="db-meta-tabs"
          items={[
            {
              key: 'columns',
              label: `字段 (${detail.columns.length})`,
              children: (
                <CompanyTable<DbMetaColumn>
                  rowKey="columnName"
                  size="small"
                  pagination={false}
                  columns={columnColumns}
                  dataSource={detail.columns}
                />
              ),
            },
            {
              key: 'indexes',
              label: `索引 (${detail.indexes.length})`,
              children: (
                <CompanyTable<DbMetaIndex>
                  rowKey="indexName"
                  size="small"
                  pagination={false}
                  columns={indexColumns}
                  dataSource={detail.indexes}
                />
              ),
            },
            {
              key: 'relations',
              label: `关系 (${relationRows.length})`,
              children: relationRows.length === 0 ? (
                <CompanyEmpty description="该表没有关联关系" />
              ) : (
                <CompanyTable<RelationRow>
                  rowKey={(record) =>
                    `${record.direction}.${record.fromTable}.${record.fromColumn}.${record.toTable}.${record.toColumn}`
                  }
                  size="small"
                  pagination={false}
                  columns={relationColumns}
                  dataSource={relationRows}
                />
              ),
            },
          ]}
        />
      </div>
    )
  }

  return (
    <div className="backend-data-management">
      <PageTitle
        title="后端数据管理"
        titleExtra={
          summary ? (
            <span className="db-meta-summary">
              <span>数据表 <b>{summary.tableCount}</b></span>
              <span>字段 <b>{summary.columnCount}</b></span>
              <span>注释完整度 <b>{summary.commentRate}%</b></span>
              <span>外键 <b>{summary.foreignKeyCount}</b></span>
              <span>推断关系 <b>{summary.inferredRelationCount}</b></span>
              <span>人工关系 <b>{summary.manualRelationCount}</b></span>
            </span>
          ) : null
        }
        actions={
          <CompanySegmented
            size="small"
            value={viewMode}
            onChange={(value) => setViewMode(value as 'structure' | 'graph')}
            options={[
              { label: '表结构', value: 'structure' },
              { label: '关系图', value: 'graph' },
            ]}
          />
        }
      />

      {viewMode === 'graph' ? (
        <section className="db-meta-content db-meta-graph-panel">
          <div className="db-meta-graph-toolbar">
            <CompanySegmented
              size="small"
              value={graphScope}
              onChange={(value) => setGraphScope(value as 'all' | 'core' | 'manual')}
              options={[
                { label: `全部关系 (${relations?.length ?? 0})`, value: 'all' },
                { label: '仅系统权限', value: 'core' },
                { label: '仅人工维护', value: 'manual' },
              ]}
            />
            <label className="db-meta-hidden-switch">
              <span>显示内部表</span>
              <CompanySwitch size="small" checked={includeHidden} onChange={setIncludeHidden} />
            </label>
          </div>
          <div className="db-meta-graph-body">
            {relationsLoading ? (
              <div className="db-meta-loading">
                <CompanySpin />
              </div>
            ) : graphTables.length === 0 ? (
              <CompanyEmpty description="暂无符合条件的关系数据" />
            ) : (
              <DbRelationGraph
                tables={graphTables}
                relations={graphRelations}
                selectedTable={selectedTable}
                onSelectTable={(tableName) => {
                  setSelectedTable(tableName)
                  setViewMode('structure')
                }}
              />
            )}
          </div>
        </section>
      ) : (
      <div className="db-meta-body">
        <aside className="db-meta-sidebar">
          <div className="db-meta-sidebar-head">
            <CompanyInput
              allowClear
              placeholder="搜索表名或注释"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <label className="db-meta-hidden-switch">
              <span>显示内部表</span>
              <CompanySwitch
                size="small"
                checked={includeHidden}
                onChange={setIncludeHidden}
              />
            </label>
          </div>
          <div className="db-meta-tree">
            {loading ? (
              <div className="db-meta-loading">
                <CompanySpin />
              </div>
            ) : treeData.length === 0 ? (
              <CompanyEmpty description="没有匹配的数据表" />
            ) : (
              <CompanyTree
                blockNode
                defaultExpandAll
                selectable
                treeData={treeData}
                selectedKeys={selectedTable ? [`table:${selectedTable}`] : []}
                onSelect={(keys) => {
                  const key = String(keys[0] ?? '')
                  if (key.startsWith('table:')) {
                    setSelectedTable(key.slice('table:'.length))
                  }
                }}
              />
            )}
          </div>
        </aside>

          <section className="db-meta-content">{renderDetail()}</section>
        </div>
      )}
    </div>
  )
}
