import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AuditOutlined,
  BranchesOutlined,
  CloseOutlined,
  MailOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  CompanyButton,
  CompanyDropdown,
  CompanyInput,
  CompanyMessage,
  CompanyPopconfirm,
  CompanyTag,
  FormPageTemplate,
} from '@donglegeyu/company-ui'
import {
  createProcessDesign,
  fetchProcessDesign,
  publishProcessDesign,
  saveProcessDesign,
} from '../api'
import NodeConfigDrawer from './NodeConfigDrawer'
import type { ConditionBranch, DesignDoc, DesignNode, EditPath, NodeType } from './types'
import { genNodeId, normalizeDoc, validateDoc } from './types'
import './designer.scss'

const NODE_META: Record<NodeType, { icon: ReactNode; color: string; bg: string; label: string }> = {
  start: { icon: <UserOutlined />, color: 'var(--ant-color-success)', bg: 'var(--ant-color-success-bg)', label: '开始' },
  approve: { icon: <AuditOutlined />, color: 'var(--ant-blue-6, #1677ff)', bg: 'var(--ant-blue-1, #e6f4ff)', label: '审批' },
  cc: { icon: <MailOutlined />, color: 'var(--ant-color-primary)', bg: 'var(--ant-color-primary-bg)', label: '抄送' },
  condition: { icon: <BranchesOutlined />, color: 'var(--ant-gold-6, #faad14)', bg: 'var(--ant-gold-1, #fffbe6)', label: '条件分支' },
  end: { icon: <CloseOutlined />, color: 'var(--ant-color-text-tertiary)', bg: 'var(--ant-color-fill-tertiary)', label: '结束' },
}

function describeNode(node: DesignNode): string {
  if (node.type === 'start') return '发起申请'
  if (node.type === 'end') return '流程结束'
  if (node.type === 'approve') {
    if (node.assigneeType === 'role') return `角色：${node.roleCode || '-'}`
    const names = node.assigneeNames?.length ? node.assigneeNames : (node.assigneeIds ?? []).map(String)
    return `${node.mode === 'all' ? '会签' : '或签'}：${names.length ? names.join('、') : '未指定'}`
  }
  if (node.type === 'cc') {
    const names = node.ccNames?.length ? node.ccNames : (node.ccIds ?? []).map(String)
    return `抄送给：${names.length ? names.join('、') : '未指定'}`
  }
  return `${node.branches?.length ?? 0} 个分支`
}

function buildInitialDoc(): DesignDoc {
  return {
    name: '',
    nodes: [
      { id: genNodeId(), type: 'start', name: '发起人' },
      { id: genNodeId(), type: 'end', name: '流程结束' },
    ],
  }
}

function parseDoc(json: string | null): DesignDoc {
  if (json) {
    try {
      const parsed = JSON.parse(json) as DesignDoc
      if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length >= 2) {
        return { name: parsed.name ?? '', nodes: parsed.nodes }
      }
    } catch {
      return buildInitialDoc()
    }
  }
  return buildInitialDoc()
}

function defaultNode(type: NodeType): DesignNode {
  if (type === 'cc') {
    return { id: genNodeId(), type: 'cc', name: '抄送', ccIds: [], ccNames: [] }
  }
  if (type === 'condition') {
    return {
      id: genNodeId(),
      type: 'condition',
      name: '条件分支',
      branches: [
        { id: genNodeId(), name: '分支1', priority: 1, op: '>', value: null, nodes: [] },
        { id: genNodeId(), name: '默认', priority: 2, op: null, value: null, nodes: [] },
      ],
    }
  }
  return {
    id: genNodeId(),
    type: 'approve',
    name: '审批',
    assigneeType: 'member',
    mode: 'any',
    assigneeIds: [],
    assigneeNames: [],
  }
}

/** 沿编辑路径定位节点列表并做不可变更新；branchIndex = -1 表示主干 */
function mapListAt(nodes: DesignNode[], path: EditPath, fn: (list: DesignNode[]) => DesignNode[]): DesignNode[] {
  if (path.branchIndex < 0) return fn(nodes)
  return nodes.map((node, index) => {
    if (index !== path.trunkIndex || node.type !== 'condition' || !node.branches) return node
    return {
      ...node,
      branches: node.branches.map((branch, bi) =>
        bi === path.branchIndex ? { ...branch, nodes: fn(branch.nodes) } : branch,
      ),
    }
  })
}

interface InsertButtonProps {
  types: NodeType[]
  onPick: (type: NodeType) => void
}

function InsertButton({ types, onPick }: InsertButtonProps) {
  const items = types.map((type) => ({
    key: type,
    label: (
      <span className="pd-insert-menu-item">
        <span className="pd-insert-menu-icon" style={{ color: NODE_META[type].color, background: NODE_META[type].bg }}>
          {NODE_META[type].icon}
        </span>
        {NODE_META[type].label}
      </span>
    ),
  }))
  return (
    <div className="pd-insert">
      <span className="pd-insert-line" />
      <CompanyDropdown trigger={['click']} menu={{ items, onClick: ({ key }) => onPick(key as NodeType) }}>
        <span className="pd-insert-btn">
          <PlusOutlined />
        </span>
      </CompanyDropdown>
      <span className="pd-insert-line" />
    </div>
  )
}

interface NodeCardProps {
  node: DesignNode
  deletable: boolean
  onDelete: () => void
  onEdit: () => void
}

function NodeCard({ node, deletable, onDelete, onEdit }: NodeCardProps) {
  const meta = NODE_META[node.type]
  return (
    <div className={`pd-node pd-node-${node.type}`} onClick={onEdit}>
      <span className="pd-node-icon" style={{ color: meta.color, background: meta.bg }}>
        {meta.icon}
      </span>
      <div className="pd-node-body">
        <div className="pd-node-name">{node.name}</div>
        <div className="pd-node-desc">{describeNode(node)}</div>
      </div>
      {deletable && (
        <span className="pd-node-del" onClick={(e) => e.stopPropagation()}>
          <CompanyPopconfirm title="确定删除该节点？" onConfirm={onDelete}>
            <CloseOutlined />
          </CompanyPopconfirm>
        </span>
      )}
    </div>
  )
}

export default function ProcessDesigner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [designId, setDesignId] = useState<number | null>(null)
  const [processKey, setProcessKey] = useState('')
  // 新建未保存时允许自定义流程标识（约定式路由依赖它），保存后锁定
  const [keyDraft, setKeyDraft] = useState('')
  const [publishedVersion, setPublishedVersion] = useState(0)
  const [doc, setDoc] = useState<DesignDoc>(buildInitialDoc)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [editing, setEditing] = useState<{ node: DesignNode; path: EditPath } | null>(null)

  useEffect(() => {
    if (isNew) return
    fetchProcessDesign(Number(id))
      .then((res) => {
        if (res.code === 200 && res.data) {
          setDesignId(res.data.id)
          setProcessKey(res.data.processKey)
          setPublishedVersion(res.data.publishedVersion)
          setDoc(parseDoc(res.data.designJson))
        } else {
          CompanyMessage.error(res.message || '流程设计加载失败')
        }
      })
      .catch(() => CompanyMessage.error('流程设计加载失败'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const insertNode = (path: EditPath, type: NodeType) => {
    setDoc((prev) => ({
      ...prev,
      nodes: mapListAt(prev.nodes, path, (list) => {
        const next = [...list]
        next.splice(path.nodeIndex, 0, defaultNode(type))
        return next
      }),
    }))
  }

  const deleteNodeAt = (path: EditPath) => {
    setDoc((prev) => ({
      ...prev,
      nodes: mapListAt(prev.nodes, path, (list) => list.filter((_, i) => i !== path.nodeIndex)),
    }))
  }

  const updateNode = (path: EditPath, next: DesignNode) => {
    setDoc((prev) => ({
      ...prev,
      nodes: mapListAt(prev.nodes, path, (list) => list.map((n, i) => (i === path.nodeIndex ? next : n))),
    }))
  }

  /** 新分支插入到默认分支（最后一支）之前 */
  const addBranch = (trunkIndex: number) => {
    setDoc((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node, i) => {
        if (i !== trunkIndex || node.type !== 'condition' || !node.branches) return node
        const branches = [...node.branches]
        const newBranch: ConditionBranch = {
          id: genNodeId(),
          name: `分支${branches.length}`,
          priority: branches.length,
          op: null,
          value: null,
          nodes: [],
        }
        branches.splice(branches.length - 1, 0, newBranch)
        return { ...node, branches }
      }),
    }))
  }

  const deleteBranch = (trunkIndex: number, branchIndex: number) => {
    setDoc((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node, i) => {
        if (i !== trunkIndex || node.type !== 'condition' || !node.branches) return node
        if (node.branches.length <= 2) return node
        return { ...node, branches: node.branches.filter((_, bi) => bi !== branchIndex) }
      }),
    }))
  }

  /** 校验并保存；silent 时不弹「保存成功」。返回草稿 id，失败返回 null */
  const doSave = async (silent = false): Promise<number | null> => {
    const err = validateDoc(doc)
    if (err) {
      CompanyMessage.warning(err)
      return null
    }
    setSaving(true)
    try {
      const name = doc.name.trim()
      const key = keyDraft.trim()
      if (key && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
        CompanyMessage.warning('流程标识必须以字母开头，只能包含字母、数字、下划线')
        return null
      }
      const designJson = JSON.stringify(normalizeDoc(doc))
      let targetId = designId
      if (targetId == null) {
        const created = await createProcessDesign(name, key || undefined)
        if (created.code !== 200 || !created.data?.id) {
          CompanyMessage.error(created.message || '保存失败')
          return null
        }
        targetId = created.data.id
        setDesignId(targetId)
        setProcessKey(created.data.processKey)
        navigate(`/approval/admin/process/design/${targetId}`, { replace: true })
      }
      const res = await saveProcessDesign(targetId, { name, designJson })
      if (res.code !== 200) {
        CompanyMessage.error(res.message || '保存失败')
        return null
      }
      if (!silent) CompanyMessage.success('保存成功')
      return targetId
    } catch {
      CompanyMessage.error('保存失败')
      return null
    } finally {
      setSaving(false)
    }
  }

  const doPublish = async () => {
    const savedId = await doSave(true)
    if (savedId == null) return
    setPublishing(true)
    try {
      const res = await publishProcessDesign(savedId)
      if (res.code !== 200 || !res.data) {
        CompanyMessage.error(res.message || '发布失败')
        return
      }
      setPublishedVersion(res.data.version)
      CompanyMessage.success(`发布成功：${res.data.name} v${res.data.version}`)
    } catch {
      CompanyMessage.error('发布失败')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="process-designer">
        <div className="pd-loading" />
      </div>
    )
  }

  const trunk = doc.nodes

  /** 主干节点：条件节点渲染分支卡片，其余渲染普通节点卡片 */
  const renderTrunkNode = (node: DesignNode, path: EditPath, deletable: boolean) => {
    if (node.type === 'condition') {
      const branches = node.branches ?? []
      return (
        <div className="pd-condition" key={node.id}>
          <div className="pd-condition-head" onClick={() => setEditing({ node, path })}>
            <span className="pd-node-icon" style={{ color: NODE_META.condition.color, background: NODE_META.condition.bg }}>
              {NODE_META.condition.icon}
            </span>
            <span className="pd-condition-name">{node.name}</span>
            <CompanyTag>{`${branches.length} 个分支`}</CompanyTag>
            {deletable && (
              <span className="pd-node-del" onClick={(e) => e.stopPropagation()}>
                <CompanyPopconfirm title="确定删除该节点？" onConfirm={() => deleteNodeAt(path)}>
                  <CloseOutlined />
                </CompanyPopconfirm>
              </span>
            )}
          </div>
          <div className="pd-branches">
            {branches.map((branch, bi) => (
              <div className="pd-branch" key={branch.id}>
                {branches.length > 2 && (
                  <span className="pd-branch-del" onClick={(e) => e.stopPropagation()}>
                    <CompanyPopconfirm title="确定删除该分支？" onConfirm={() => deleteBranch(path.trunkIndex, bi)}>
                      <CloseOutlined />
                    </CompanyPopconfirm>
                  </span>
                )}
                <div className="pd-branch-head" onClick={() => setEditing({ node, path })}>
                  <span className="pd-branch-priority">{`优先级${branch.priority}`}</span>
                  <span className="pd-branch-name">{branch.name}</span>
                </div>
                <span className="pd-branch-cond">
                  {branch.op == null ? '默认分支' : `金额 ${branch.op} ${branch.value ?? ''}`}
                </span>
                <div className="pd-branch-body">
                  {branch.nodes.map((branchNode, ni) => (
                    <Fragment key={branchNode.id}>
                      <InsertButton
                        types={['approve', 'cc']}
                        onPick={(type) =>
                          insertNode({ trunkIndex: path.trunkIndex, branchIndex: bi, nodeIndex: ni }, type)
                        }
                      />
                      <NodeCard
                        node={branchNode}
                        deletable={branch.nodes.length > 1}
                        onDelete={() =>
                          deleteNodeAt({ trunkIndex: path.trunkIndex, branchIndex: bi, nodeIndex: ni })
                        }
                        onEdit={() =>
                          setEditing({ node: branchNode, path: { trunkIndex: path.trunkIndex, branchIndex: bi, nodeIndex: ni } })
                        }
                      />
                    </Fragment>
                  ))}
                  <InsertButton
                    types={['approve', 'cc']}
                    onPick={(type) =>
                      insertNode(
                        { trunkIndex: path.trunkIndex, branchIndex: bi, nodeIndex: branch.nodes.length },
                        type,
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <div className="pd-branch-add" onClick={() => addBranch(path.trunkIndex)}>
              + 添加分支
            </div>
          </div>
        </div>
      )
    }
    return (
      <NodeCard
        key={node.id}
        node={node}
        deletable={deletable}
        onDelete={() => deleteNodeAt(path)}
        onEdit={() => setEditing({ node, path })}
      />
    )
  }

  return (
    <FormPageTemplate
      title="流程设计"
      titleExtra={
        <>
          <CompanyInput
            className="pd-name-input"
            variant="borderless"
            value={doc.name}
            maxLength={64}
            placeholder="请输入流程名称"
            onChange={(e) => setDoc((prev) => ({ ...prev, name: e.target.value }))}
          />
          <div className="pd-topbar-meta">
            {designId == null ? (
              <CompanyInput
                className="pd-name-input"
                variant="borderless"
                value={keyDraft}
                maxLength={64}
                placeholder="流程标识(可选,如 craftsmanApplication)"
                onChange={(e) => setKeyDraft(e.target.value)}
              />
            ) : (
              processKey && <span className="pd-meta-key">{processKey}</span>
            )}
            {publishedVersion > 0 && <CompanyTag color="orange">{`已发布 v${publishedVersion}`}</CompanyTag>}
          </div>
        </>
      }
      showBack
      onBack={() => navigate('/approval/admin/process')}
      contentWrapped={false}
      contentClassName="process-designer"
      footer={
        <div className="pd-footer">
          <CompanyButton onClick={() => doSave()} loading={saving}>
            保存
          </CompanyButton>
          <CompanyButton type="primary" onClick={doPublish} loading={publishing}>
            发布
          </CompanyButton>
        </div>
      }
    >
      <div className="pd-canvas">
        <div className="pd-flow">
          {trunk.map((node, index) => (
            <Fragment key={node.id}>
              {index > 0 && (
                <InsertButton
                  types={['approve', 'cc', 'condition']}
                  onPick={(type) => insertNode({ trunkIndex: index, branchIndex: -1, nodeIndex: index }, type)}
                />
              )}
              {renderTrunkNode(
                node,
                { trunkIndex: index, branchIndex: -1, nodeIndex: index },
                index > 0 && index < trunk.length - 1,
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <NodeConfigDrawer
        open={!!editing}
        node={editing?.node ?? null}
        onClose={() => setEditing(null)}
        onSubmit={(next) => {
          if (editing) updateNode(editing.path, next)
          setEditing(null)
        }}
      />
    </FormPageTemplate>
  )
}
