/** 流程设计器类型定义（与后端设计 JSON 结构一一对应） */

export type NodeType = 'start' | 'approve' | 'cc' | 'condition' | 'end'

export type AssigneeType = 'member' | 'role'

/** 审批方式：any=或签（任一人通过即过），all=会签（全部通过才过） */
export type ApproveMode = 'any' | 'all'

/** 条件分支条件（挂主服务 amount 字段；最后一支为默认流，op/value 为 null） */
export type ConditionOp = '>' | '>=' | '<' | '<=' | '=='

export interface ConditionBranch {
  id: string
  name: string
  priority: number
  op: ConditionOp | null
  value: number | null
  nodes: DesignNode[]
}

export interface DesignNode {
  id: string
  type: NodeType
  name: string
  /** approve：审批人类型（成员/角色） */
  assigneeType?: AssigneeType
  assigneeIds?: number[]
  assigneeNames?: string[]
  roleCode?: string
  /** approve：或签/会签 */
  mode?: ApproveMode
  /** cc：抄送人 */
  ccIds?: number[]
  ccNames?: string[]
  /** condition：分支列表 */
  branches?: ConditionBranch[]
}

export interface DesignDoc {
  name: string
  nodes: DesignNode[]
}

/** 节点编辑路径：branchIndex = -1 表示主干；trunkIndex 指向主干上的条件节点；nodeIndex 为目标列表内的下标 */
export interface EditPath {
  trunkIndex: number
  branchIndex: number
  nodeIndex: number
}

export const OP_OPTIONS: { label: string; value: ConditionOp }[] = [
  { label: '大于', value: '>' },
  { label: '大于等于', value: '>=' },
  { label: '小于', value: '<' },
  { label: '小于等于', value: '<=' },
  { label: '等于', value: '==' },
]

export function genNodeId(): string {
  return 'node_' + Math.random().toString(36).slice(2, 8)
}

/** 按数组顺序重排分支优先级 */
export function normalizeDoc(doc: DesignDoc): DesignDoc {
  const nodes = doc.nodes.map((node) => {
    if (node.type !== 'condition' || !node.branches) return node
    return {
      ...node,
      branches: node.branches.map((branch, index) => ({ ...branch, priority: index + 1 })),
    }
  })
  return { ...doc, nodes }
}

/** 保存/发布前的轻量校验，返回第一个错误提示；通过返回 null */
export function validateDoc(doc: DesignDoc): string | null {
  if (!doc.name.trim()) return '请填写流程名称'
  const nodes = doc.nodes
  if (nodes.length < 2) return '请先设计流程节点'
  if (nodes[0].type !== 'start') return '第一个节点必须是开始节点'
  if (nodes[nodes.length - 1].type !== 'end') return '最后一个节点必须是结束节点'

  const check = (list: DesignNode[], inBranch: boolean): string | null => {
    for (const node of list) {
      if (inBranch && (node.type === 'start' || node.type === 'end')) {
        return `「${node.name}」不能出现在条件分支内`
      }
      if (node.type === 'approve') {
        if (node.assigneeType === 'role') {
          if (!node.roleCode?.trim()) return `审批节点「${node.name}」未指定角色`
        } else if (!node.assigneeIds?.length) {
          return `审批节点「${node.name}」未指定审批人`
        }
      }
      if (node.type === 'condition') {
        if (!node.branches || node.branches.length < 2) {
          return `条件节点「${node.name}」至少需要 2 个分支`
        }
        for (let i = 0; i < node.branches.length; i++) {
          const branch = node.branches[i]
          if (!branch.name.trim()) return `条件节点「${node.name}」存在未命名的分支`
          if (!branch.nodes.length) return `分支「${branch.name}」内容为空`
          if (i < node.branches.length - 1 && (branch.op == null || branch.value == null)) {
            return `分支「${branch.name}」缺少条件表达式`
          }
          const err = check(branch.nodes, true)
          if (err) return err
        }
      }
    }
    return null
  }
  return check(nodes, false)
}
