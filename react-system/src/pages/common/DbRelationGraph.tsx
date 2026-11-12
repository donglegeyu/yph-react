import { useMemo, useState } from 'react'
import './DbRelationGraph.scss'

export interface DbRelationGraphTable {
  tableName: string
  displayName: string
  groupName: string
}

export interface DbRelationGraphEdge {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  source: string
  label: string | null
}

interface DbRelationGraphProps {
  tables: DbRelationGraphTable[]
  relations: DbRelationGraphEdge[]
  selectedTable?: string | null
  onSelectTable?: (tableName: string) => void
}

const GROUP_ORDER = ['系统权限', '业务数据', '业务申请', '关联表', '视图与配置', '平台内部']

const NODE_WIDTH = 200
const NODE_HEIGHT = 48
const GAP_X = 108
const GAP_Y = 12
const PADDING = 20

interface NodePosition {
  x: number
  y: number
  table: DbRelationGraphTable
}

function buildLayout(tables: DbRelationGraphTable[]): {
  nodes: Map<string, NodePosition>
  width: number
  height: number
  groups: string[]
} {
  const buckets = new Map<string, DbRelationGraphTable[]>()
  tables.forEach((table) => {
    const list = buckets.get(table.groupName) ?? []
    list.push(table)
    buckets.set(table.groupName, list)
  })

  const groups = Array.from(buckets.keys()).sort((a, b) => {
    const indexA = GROUP_ORDER.indexOf(a)
    const indexB = GROUP_ORDER.indexOf(b)
    return (indexA < 0 ? GROUP_ORDER.length : indexA) - (indexB < 0 ? GROUP_ORDER.length : indexB)
  })

  const nodes = new Map<string, NodePosition>()
  let maxRows = 0
  groups.forEach((group, groupIndex) => {
    const list = (buckets.get(group) ?? []).slice().sort((a, b) => a.tableName.localeCompare(b.tableName))
    maxRows = Math.max(maxRows, list.length)
    list.forEach((table, rowIndex) => {
      nodes.set(table.tableName, {
        x: PADDING + groupIndex * (NODE_WIDTH + GAP_X),
        y: PADDING + rowIndex * (NODE_HEIGHT + GAP_Y),
        table,
      })
    })
  })

  return {
    nodes,
    groups,
    width: PADDING * 2 + groups.length * (NODE_WIDTH + GAP_X) - GAP_X,
    height: PADDING * 2 + Math.max(maxRows, 1) * (NODE_HEIGHT + GAP_Y) - GAP_Y,
  }
}

function edgePath(from: NodePosition, to: NodePosition, index: number): string {
  if (from.table.tableName === to.table.tableName) {
    const x = from.x + NODE_WIDTH
    const y = from.y + NODE_HEIGHT / 2
    return `M ${x} ${y} C ${x + 56} ${y - 26}, ${x + 56} ${y + 26}, ${x} ${y + 18}`
  }
  const offset = index % 3 === 0 ? 0 : index % 3 === 1 ? 4 : -4
  const x1 = from.x + NODE_WIDTH
  const y1 = from.y + NODE_HEIGHT / 2 + offset
  const x2 = to.x
  const y2 = to.y + NODE_HEIGHT / 2 + offset
  const control = Math.max(52, Math.abs(x2 - x1) / 2)
  const direction = x2 >= x1 ? 1 : -1
  return `M ${x1} ${y1} C ${x1 + control * direction} ${y1}, ${x2 - control * direction} ${y2}, ${x2} ${y2}`
}

export default function DbRelationGraph({
  tables,
  relations,
  selectedTable,
  onSelectTable,
}: DbRelationGraphProps) {
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const { nodes, width, height, groups } = useMemo(() => buildLayout(tables), [tables])

  const visibleEdges = useMemo(
    () =>
      relations.filter(
        (edge) => nodes.has(edge.fromTable) && nodes.has(edge.toTable),
      ),
    [relations, nodes],
  )

  const activeTable = hoveredTable ?? selectedTable ?? null
  const relatedTables = useMemo(() => {
    if (!activeTable) return new Set<string>()
    const set = new Set<string>()
    visibleEdges.forEach((edge) => {
      if (edge.fromTable === activeTable) set.add(edge.toTable)
      if (edge.toTable === activeTable) set.add(edge.fromTable)
    })
    return set
  }, [activeTable, visibleEdges])

  return (
    <div className="db-relation-graph">
      <div className="db-relation-graph-canvas" style={{ width, height }}>
        <svg width={width} height={height}>
          {groups.map((group) => {
            const groupNodes = tables.filter((table) => table.groupName === group)
            if (groupNodes.length === 0) return null
            const first = nodes.get(groupNodes[0].tableName)
            if (!first) return null
            return (
              <text
                key={group}
                className="db-relation-graph-group"
                x={first.x}
                y={Math.max(first.y - 6, 12)}
              >
                {group}
              </text>
            )
          })}

          {visibleEdges.map((edge, index) => {
            const from = nodes.get(edge.fromTable)
            const to = nodes.get(edge.toTable)
            if (!from || !to) return null
            const highlighted =
              activeTable !== null && (edge.fromTable === activeTable || edge.toTable === activeTable)
            return (
              <path
                key={`${edge.fromTable}.${edge.fromColumn}->${edge.toTable}.${edge.toColumn}`}
                className={[
                  'db-relation-graph-edge',
                  `is-${edge.source}`,
                  highlighted ? 'is-active' : '',
                  activeTable && !highlighted ? 'is-dimmed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                d={edgePath(from, to, index)}
                fill="none"
              >
                <title>{`${edge.fromTable}.${edge.fromColumn} → ${edge.toTable}.${edge.toColumn}`}</title>
              </path>
            )
          })}

          {Array.from(nodes.values()).map((node) => {
            const isActive = activeTable === node.table.tableName
            const isRelated = relatedTables.has(node.table.tableName)
            const classes = [
              'db-relation-graph-node',
              `group-${groups.indexOf(node.table.groupName)}`,
              isActive ? 'is-active' : '',
              isRelated ? 'is-related' : '',
              activeTable && !isActive && !isRelated ? 'is-dimmed' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <g
                key={node.table.tableName}
                className={classes}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectTable?.(node.table.tableName)}
                onMouseEnter={() => setHoveredTable(node.table.tableName)}
                onMouseLeave={() => setHoveredTable(null)}
              >
                <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx={8} />
                <text className="db-relation-graph-node-label" x={12} y={21}>
                  {node.table.displayName}
                </text>
                <text className="db-relation-graph-node-name" x={12} y={37}>
                  {node.table.tableName}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="db-relation-graph-legend">
        <span className="legend-item"><i className="line is-fk" />外键</span>
        <span className="legend-item"><i className="line is-convention" />命名推断</span>
        <span className="legend-item"><i className="line is-manual" />人工维护</span>
        <span className="legend-item legend-hint">点击节点查看表结构</span>
      </div>
    </div>
  )
}
