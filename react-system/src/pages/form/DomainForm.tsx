import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tree, Input, Select, InputNumber, Table, Alert, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { CompanyButton, CompanyCard, CompanyDrawer, CompanyMessage } from '@donglegeyu/company-ui'
import PageTitle from '@/components/PageTitle'
import SectionTitle from '@/components/SectionTitle'
import BaseInfoForm, { type BaseInfoFormRef } from '@/components/BaseInfoForm'
import IconSelect from '@/components/IconSelect'
import FormFooterActions from '@/components/FormFooterActions'
import { API_ENDPOINTS } from '@/constants/api'
import './DomainForm.scss'

interface MoveTreeNode {
  key: string
  label: string
  disabled: boolean
  children?: MoveTreeNode[]
}

interface SystemMenu {
  id: number
  key?: string
  label: string
  path?: string
  icon?: string
  status: number
  parentId?: number | null
  sort?: number
  menuType?: string
  children?: SystemMenu[]
}

interface DomainMenu {
  domainId: number
  menuId: number
  menuName?: string
  customLabel: string
  sort: number
  originalLabel: string
  status: number
  parentId: number
  menuLevel: number
  icon?: string
}

interface DataPermission {
  domainId: number
  menuKey: string
  filterType: 'all' | 'self' | 'custom'
  filterField: string
  filterValue?: string
}

interface DomainFormData {
  domainKey: string
  domainName: string
  description: string
  status: number
  isDefault?: number
}

const statusOptions = [
  { value: 1, label: '启用' },
  { value: 0, label: '禁用' },
]

const baseInfoFields = [
  {
    name: 'domainName',
    label: '域名称',
    type: 'input' as const,
    required: true,
    rules: [
      { required: true, message: '请输入域名称' },
      { max: 50, message: '域名称不能超过50个字符' },
    ],
  },
  {
    name: 'domainKey',
    label: '域标识',
    type: 'input' as const,
    placeholder: '根据域名称自动生成',
    readonly: true,
    required: true,
    rules: [
      { required: true, message: '域标识自动生成' },
      { max: 100, message: '域标识不能超过100个字符' },
    ],
  },
  {
    name: 'status',
    label: '状态',
    type: 'select' as const,
    options: [
      { value: 1, label: '启用' },
      { value: 0, label: '禁用' },
    ],
  },
  {
    name: 'description',
    label: '描述',
    type: 'textarea' as const,
    rules: [
      { max: 200, message: '描述不能超过200个字符' },
    ],
  },
]

export default function DomainForm() {
  const params = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(params.id)
  const pageTitle = isEdit ? '编辑域' : '新增域'

  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formData, setFormData] = useState<DomainFormData>({
    domainKey: '',
    domainName: '',
    description: '',
    status: 1,
  })

  const [systemMenus, setSystemMenus] = useState<SystemMenu[]>([])
  const [domainMenus, setDomainMenus] = useState<DomainMenu[]>([])
  const [dataPermissions, setDataPermissions] = useState<DataPermission[]>([])

  const baseInfoFormRef = useRef<BaseInfoFormRef>(null)

  const [drawerVisible, setDrawerVisible] = useState(false)
  const [menuSearchKeyword, setMenuSearchKeyword] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([])
  const [checkedKeys, setCheckedKeys] = useState<(string | number)[]>([])

  const [moveDrawerVisible, setMoveDrawerVisible] = useState(false)
  const [moveTargetRecord, setMoveTargetRecord] = useState<any>(null)
  const [selectedMoveTargetId, setSelectedMoveTargetId] = useState<number | null>(null)
  const [moveExpandedKeys, setMoveExpandedKeys] = useState<string[]>([])
  const [moveTreeData, setMoveTreeData] = useState<MoveTreeNode[]>([])

  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkedCount = checkedKeys.length

  function collectAllMenus(menus: SystemMenu[]): Map<number, SystemMenu> {
    const map = new Map<number, SystemMenu>()
    const walk = (items: SystemMenu[]) => {
      items.forEach(m => {
        map.set(m.id, m)
        if (m.children) walk(m.children)
      })
    }
    walk(menus)
    return map
  }

  function findParentAndLevel(menus: SystemMenu[], targetId: number, level = 1): { parentId: number; level: number } | null {
    for (const menu of menus) {
      if (menu.id === targetId) return { parentId: 0, level }
      if (menu.children?.length) {
        for (const child of menu.children) {
          if (child.id === targetId) return { parentId: menu.id, level: level + 1 }
          const found = findParentAndLevel([child], targetId, level + 1)
          if (found) return found
        }
      }
    }
    return null
  }

  function generateDomainKey(domainName: string) {
    return domainName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  // -------- Fetch functions --------
  const fetchSystemMenus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API_ENDPOINTS.NAV_MENUS)
      const json = await res.json()
      if (json.code === 200) {
        setSystemMenus(json.data || [])
        setExpandedKeys((json.data || []).map((m: SystemMenu) => m.id))
      }
    } catch {
      CompanyMessage.error('加载系统菜单失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDomain = useCallback(async (domainId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_ENDPOINTS.DOMAINS}/${domainId}`)
      const json = await res.json()
      if (json.code === 200 && json.data) {
        setFormData({
          domainKey: json.data.domainKey,
          domainName: json.data.domainName,
          description: json.data.description || '',
          status: json.data.status,
          isDefault: json.data.isDefault,
        })
      }
    } catch {
      CompanyMessage.error('加载域详情失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDomainMenus = useCallback(async (domainId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_ENDPOINTS.DOMAIN_MENUS}?domainId=${domainId}`)
      const json = await res.json()
      if (json.code === 200) {
        const sysMenuMap = collectAllMenus(systemMenus)
        const menus = (json.data || []).map((m: any) => {
          const sysMenu = sysMenuMap.get(m.menuId)
          let parentId = m.parentId ?? 0
          let menuLevel = m.menuLevel ?? 1
          if (parentId === 0 && !m.menuLevel) {
            const result = findParentAndLevel(systemMenus, m.menuId)
            if (result) {
              parentId = result.parentId
              menuLevel = result.level
            }
          }
          return {
            domainId: 0,
            menuId: m.menuId,
            customLabel: m.customLabel || '',
            sort: m.sort ?? 0,
            originalLabel: sysMenu?.label || '',
            status: m.status ?? 1,
            parentId,
            menuLevel,
            icon: sysMenu?.icon || '',
          }
        })
        setDomainMenus(menus)
      }
    } catch {
      CompanyMessage.error('加载域菜单失败')
    } finally {
      setLoading(false)
    }
  }, [systemMenus])

  const fetchDataPermissions = useCallback(async (domainId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_ENDPOINTS.DATA_PERMISSIONS}?domainId=${domainId}`)
      const json = await res.json()
      if (json.code === 200) {
        setDataPermissions(json.data || [])
      }
    } catch {
      CompanyMessage.error('加载数据权限失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // -------- filteredTreeData --------
  const filteredTreeData = (() => {
    const addedMenuIds = new Set(domainMenus.map(m => m.menuId))
    const keyword = menuSearchKeyword

    function filter(menus: SystemMenu[]): any[] {
      return menus.filter(menu => {
        if (addedMenuIds.has(menu.id)) return false
        const match = keyword
          ? menu.label.toLowerCase().includes(keyword.toLowerCase())
          : true
        const children = menu.children ? filter(menu.children) : []
        if (match || children.length > 0) {
          return true
        }
        return false
      }).map(menu => ({
        label: menu.label,
        id: menu.id,
        children: menu.children ? filter(menu.children) : [],
      }))
    }

    return filter(systemMenus)
  })()

  // -------- menuTreeData --------
  const menuTreeData = (() => {
    const buildTree = (parentId: number = 0): any[] => {
      return domainMenus
        .filter(m => m.parentId === parentId)
        .map(m => ({
          ...m,
          key: m.menuId,
          menuName: m.customLabel || m.originalLabel,
          children: buildTree(m.menuId),
        }))
    }
    return buildTree()
  })()

  // -------- Drawer handlers --------
  function onExpand(keys: (string | number)[]) {
    setExpandedKeys(keys.map(k => Number(k)))
  }

  function onCheck(checked: any) {
    if (Array.isArray(checked)) {
      setCheckedKeys(checked)
    } else {
      setCheckedKeys(checked.checked || [])
    }
  }

  function confirmSelection() {
    const sysMenuMap = collectAllMenus(systemMenus)
    const existingMenuIds = new Set(domainMenus.map(m => m.menuId))

    setDomainMenus(prev => {
      const newMenus = [...prev]
      checkedKeys.forEach(id => {
        const menuId = Number(id)
        if (!existingMenuIds.has(menuId)) {
          const sysMenu = sysMenuMap.get(menuId)
          const parentResult = findParentAndLevel(systemMenus, menuId)
          newMenus.push({
            domainId: 0,
            menuId,
            customLabel: '',
            sort: newMenus.length,
            originalLabel: sysMenu?.label || '',
            status: 1,
            parentId: parentResult?.parentId || 0,
            menuLevel: parentResult?.level || 1,
            icon: sysMenu?.icon || '',
          })
        }
      })
      return newMenus
    })

    setCheckedKeys([])
    closeDrawer()
  }

  function closeDrawer() {
    setDrawerVisible(false)
    setMenuSearchKeyword('')
  }

  // -------- Menu table handlers --------
  function handleMenuNameChange(record: any) {
    setDomainMenus(prev =>
      prev.map(m => m.menuId === record.menuId ? { ...m, customLabel: record.menuName } : m)
    )
  }

  function handleStatusChange(record: any, status: number) {
    setDomainMenus(prev =>
      prev.map(m => m.menuId === record.menuId ? { ...m, status } : m)
    )
  }

  function handleSortChange(record: any, sort: number | null) {
    setDomainMenus(prev =>
      prev.map(m => m.menuId === record.menuId ? { ...m, sort: sort ?? 0 } : m)
    )
  }

  function handleMenuIconChange(record: any, icon: string) {
    setDomainMenus(prev =>
      prev.map(m => m.menuId === record.menuId ? { ...m, icon } : m)
    )
  }

  function handleRemoveMenu(record: any) {
    setDomainMenus(prev => prev.filter(m => m.menuId !== record.menuId))
  }

  // -------- Permission handlers --------
  function handleAddPermission() {
    setDataPermissions(prev => [
      ...prev,
      { domainId: 0, menuKey: '', filterType: 'all', filterField: '' },
    ])
  }

  function handleRemovePermission(index: number) {
    setDataPermissions(prev => prev.filter((_, i) => i !== index))
  }

  // -------- Move drawer --------
  function getSubTreeDepth(node: any): number {
    if (!node.children?.length) return 0
    let maxChildDepth = 0
    for (const child of node.children) {
      maxChildDepth = Math.max(maxChildDepth, getSubTreeDepth(child))
    }
    return 1 + maxChildDepth
  }

  function buildMoveTreeData(record: any): MoveTreeNode[] {
    const maxSubLevel = getSubTreeDepth(record)
    const selectedMenuIdStrs = new Set(domainMenus.map(m => String(m.menuId)))
    const excludedIds = new Set([String(record.menuId)])

    function traverse(items: SystemMenu[]): MoveTreeNode[] {
      const nodes: MoveTreeNode[] = []

      for (const item of items) {
        const itemIdStr = String(item.id)

        if (excludedIds.has(itemIdStr)) continue

        const childrenNodes = item.children?.length ? traverse(item.children) : undefined
        const hasSelectedDescendant = childrenNodes && childrenNodes.length > 0
        const isSelected = selectedMenuIdStrs.has(itemIdStr)

        if (!isSelected && !hasSelectedDescendant) continue

        const findLevel = (menus: SystemMenu[], targetId: number, level: number = 1): number => {
          for (const menu of menus) {
            if (menu.id === targetId) return level
            if (menu.children?.length) {
              const found = findLevel(menu.children, targetId, level + 1)
              if (found > 0) return found
            }
          }
          return 1
        }
        const targetMenuLevel = findLevel(systemMenus, item.id)
        const wouldExceed = targetMenuLevel + maxSubLevel > 3

        nodes.push({
          key: itemIdStr,
          label: item.label,
          disabled: wouldExceed,
          children: childrenNodes,
        })
      }

      return nodes
    }

    return traverse(systemMenus)
  }

  function onMoveTreeSelect(selectedKeys: (string | number)[]) {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0]
      const node = findMoveTreeNode(moveTreeData, String(key))
      if (!node || !node.disabled) {
        setSelectedMoveTargetId(Number(key))
      }
    }
  }

  function onMoveTreeExpand(keys: (string | number)[]) {
    setMoveExpandedKeys(keys as string[])
  }

  function findMoveTreeNode(nodes: MoveTreeNode[], key: string): MoveTreeNode | null {
    for (const node of nodes) {
      if (String(node.key) === key) return node
      if (node.children?.length) {
        const found = findMoveTreeNode(node.children, key)
        if (found) return found
      }
    }
    return null
  }

  function openMoveDrawer(record: any) {
    setMoveTargetRecord(record)
    setSelectedMoveTargetId(null)
    setMoveTreeData(buildMoveTreeData(record))
    setMoveExpandedKeys(systemMenus.map(item => String(item.id)))
    setMoveDrawerVisible(true)
  }

  function closeMoveDrawer() {
    setMoveDrawerVisible(false)
    setMoveTargetRecord(null)
    setSelectedMoveTargetId(null)
    setMoveTreeData([])
    setMoveExpandedKeys([])
  }

  function updateChildrenLevel(parentId: number, parentLevel: number) {
    setDomainMenus(prev => {
      const updated = [...prev]
      function walkChildren(pId: number, pLevel: number) {
        for (const child of updated) {
          if (child.parentId === pId) {
            child.menuLevel = pLevel + 1
            walkChildren(child.menuId, child.menuLevel)
          }
        }
      }
      walkChildren(parentId, parentLevel)
      return [...updated]
    })
  }

  function confirmMove() {
    if (!moveTargetRecord || selectedMoveTargetId === null) return

    setDomainMenus(prev => {
      const updated = prev.map(m => {
        if (m.menuId === moveTargetRecord.menuId) {
          let newLevel = 1
          if (selectedMoveTargetId === 0) {
            newLevel = 1
          } else {
            const parentMenu = prev.find(pm => pm.menuId === selectedMoveTargetId)
            if (parentMenu) {
              newLevel = (parentMenu.menuLevel || 1) + 1
            } else {
              const findParentLevel = (menus: SystemMenu[], targetId: number, level: number = 1): number => {
                for (const menu of menus) {
                  if (menu.id === targetId) return level
                  if (menu.children?.length) {
                    const found = findParentLevel(menu.children, targetId, level + 1)
                    if (found > 0) return found
                  }
                }
                return 0
              }
              const parentLevel = findParentLevel(systemMenus, selectedMoveTargetId)
              newLevel = parentLevel > 0 ? parentLevel + 1 : 1
            }
          }
          return { ...m, parentId: selectedMoveTargetId, menuLevel: newLevel }
        }
        return m
      })

      function walkChildren(parentId: number, parentLevel: number) {
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].parentId === parentId) {
            updated[i] = { ...updated[i], menuLevel: parentLevel + 1 }
            walkChildren(updated[i].menuId, updated[i].menuLevel)
          }
        }
      }
      walkChildren(moveTargetRecord.menuId, updated.find(m => m.menuId === moveTargetRecord.menuId)?.menuLevel || 1)

      return updated
    })

    closeMoveDrawer()
  }

  // -------- Submit / Cancel --------
  function handleCancel() {
    navigate('/domain-manage')
  }

  async function handleSubmit() {
    const valid = await baseInfoFormRef.current?.validate()
    if (!valid) return

    setSubmitLoading(true)
    try {
      let domainId: number | undefined

      if (isEdit && params.id) {
        await fetch(`${API_ENDPOINTS.DOMAINS}/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        domainId = Number(params.id)
      } else {
        const res = await fetch(API_ENDPOINTS.DOMAINS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const json = await res.json()
        if (json.code === 200) {
          domainId = typeof json.data === 'number' ? json.data : json.data?.id
        }
      }

      if (domainId && formData.isDefault !== 1) {
        await fetch(API_ENDPOINTS.DOMAIN_MENUS_BATCH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(domainMenus.map((m, i) => ({
            domainId,
            menuId: m.menuId,
            customLabel: m.customLabel,
            sort: m.sort || i + 1,
            status: m.status,
          }))),
        })

        await fetch(API_ENDPOINTS.DATA_PERMISSIONS_BATCH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataPermissions.map(p => ({ ...p, domainId }))),
        })
      }

      CompanyMessage.success(isEdit ? '更新成功' : '创建成功')
      navigate('/domain-manage')
    } catch {
      CompanyMessage.error('操作失败')
    } finally {
      setSubmitLoading(false)
    }
  }

  // -------- Scroll --------
  function handleScroll() {
    setIsScrolling(true)
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current)
    }
    scrollTimerRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 500)
  }

  // -------- Init --------
  useEffect(() => {
    fetchSystemMenus()
  }, [fetchSystemMenus])

  useEffect(() => {
    if (isEdit && params.id && systemMenus.length > 0) {
      const domainId = Number(params.id)
      Promise.all([
        fetchDomain(domainId),
        fetchDomainMenus(domainId),
        fetchDataPermissions(domainId),
      ])
    }
  }, [isEdit, params.id, systemMenus, fetchDomain, fetchDomainMenus, fetchDataPermissions])

  // -------- Column definitions --------
  const menuColumns = [
    {
      title: '菜单名称', key: 'menuName', width: 360, ellipsis: true,
      render: (_: any, record: any) => (
        <div className="menu-name-cell">
          <Input
            value={record.menuName}
            placeholder="自定义名称"
            size="middle"
            className="menu-name-input"
            style={{ width: '100%' }}
            onChange={e => {
              record.menuName = e.target.value
            }}
            onBlur={() => handleMenuNameChange(record)}
          />
        </div>
      ),
    },
    {
      title: '菜单层级', key: 'menuLevel',
      render: (_: any, record: any) => (
        <Input
          value={['一级', '二级', '三级'][record.menuLevel - 1] || '三级'}
          disabled
          size="middle"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '状态', key: 'status',
      render: (_: any, record: any) => (
        <Select
          value={record.status}
          options={statusOptions}
          size="middle"
          style={{ width: '100%' }}
          onChange={(value) => handleStatusChange(record, value)}
        />
      ),
    },
    {
      title: '图标', key: 'icon',
      render: (_: any, record: any) => (
        <IconSelect
          value={record.icon || ''}
          placeholder="选择图标"
          size="middle"
          style={{ width: 120 }}
          onChange={(icon: string) => handleMenuIconChange(record, icon)}
        />
      ),
    },
    {
      title: '排序', key: 'sort', width: 160,
      render: (_: any, record: any) => (
        <InputNumber
          value={record.sort}
          min={0}
          size="middle"
          style={{ width: '100%' }}
          onChange={(value) => handleSortChange(record, value)}
        />
      ),
    },
    {
      title: '操作', key: 'action', width: 120, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <div style={{ width: 120, display: 'flex', gap: 8 }}>
          <CompanyButton
            type="link"
            size="small"
            onClick={() => openMoveDrawer(record)}
          >
            移动
          </CompanyButton>
          <CompanyButton
            type="link"
            danger
            size="small"
            onClick={() => handleRemoveMenu(record)}
          >
            移除
          </CompanyButton>
        </div>
      ),
    },
  ]

  const permissionColumns = [
    {
      title: '菜单', key: 'menuKey', width: 200,
      render: (_: any, record: DataPermission, index: number) => (
        <Select
          value={record.menuKey || undefined}
          placeholder="选择菜单"
          style={{ width: '100%' }}
          onChange={(value) => {
            setDataPermissions(prev =>
              prev.map((p, i) => i === index ? { ...p, menuKey: value } : p)
            )
          }}
          options={domainMenus.map(m => ({
            value: String(m.menuId),
            label: m.customLabel || m.originalLabel,
          }))}
        />
      ),
    },
    {
      title: '过滤类型', key: 'filterType', width: 120,
      render: (_: any, record: DataPermission, index: number) => (
        <Select
          value={record.filterType}
          style={{ width: '100%' }}
          onChange={(value) => {
            setDataPermissions(prev =>
              prev.map((p, i) => i === index ? { ...p, filterType: value } : p)
            )
          }}
          options={[
            { value: 'all', label: '全部' },
            { value: 'self', label: '仅本人' },
            { value: 'custom', label: '自定义' },
          ]}
        />
      ),
    },
    {
      title: '过滤字段', key: 'filterField', width: 150,
      render: (_: any, record: DataPermission, index: number) => (
        <Input
          value={record.filterField}
          placeholder="过滤字段"
          onChange={(e) => {
            setDataPermissions(prev =>
              prev.map((p, i) => i === index ? { ...p, filterField: e.target.value } : p)
            )
          }}
        />
      ),
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: any, __: DataPermission, index: number) => (
        <CompanyButton type="link" danger size="small" onClick={() => handleRemovePermission(index)}>
          删除
        </CompanyButton>
      ),
    },
  ]

  // -------- Move tree title render --------
  const moveTreeTitleRender = useCallback((nodeData: any) => {
    const disabled = nodeData.disabled
    return (
      <span className={disabled ? 'tree-node-disabled' : ''}>
        {nodeData.label}
        {disabled && (
          <span style={{ color: 'var(--color-text-disabled)', fontSize: 12 }}>（超出层级）</span>
        )}
      </span>
    )
  }, [])

  return (
    <div className="domain-form">
      <PageTitle title={pageTitle} showBack backPath="/domain-manage" className="domain-page-title" />
      <div className="domain-wrapper">
        <div
          className={`domain-container${isScrolling ? ' scrolling' : ''}`}
          onScroll={handleScroll}
        >
          <CompanyCard className="domain-main-card">
            <div className="domain-section">
              <SectionTitle title="基础信息" />
              <BaseInfoForm
                ref={baseInfoFormRef}
                value={formData}
                fields={baseInfoFields}
                layout="horizontal"
                onFieldChange={(field, value) => {
                  if (field === 'domainName' && !isEdit && value) {
                    setFormData(prev => ({ ...prev, domainName: value, domainKey: generateDomainKey(value) }))
                  } else {
                    setFormData(prev => ({ ...prev, [field]: value }))
                  }
                }}
                onChange={(allValues) => setFormData(prev => ({ ...prev, ...allValues }))}
              />
            </div>

            <div className="domain-section">
              <SectionTitle title={`域内菜单配置${formData.isDefault !== 1 ? ' (' + domainMenus.length + ')' : ''}`} />
              {formData.isDefault === 1 ? (
                <div style={{ marginBottom: 16 }}>
                  <Alert type="warning" showIcon message="默认域的域内菜单配置禁止修改，菜单数量、层级等与菜单管理的数据始终保持一致" />
                </div>
              ) : (
                <div className="menu-config-header">
                  <CompanyButton type="primary" onClick={() => setDrawerVisible(true)}>
                    添加菜单
                  </CompanyButton>
                </div>
              )}

              {formData.isDefault !== 1 && (
                <Table
                  className="domain-table-box"
                  columns={menuColumns}
                  dataSource={menuTreeData}
                  pagination={false}
                  rowKey={(record) => record.key}
                  defaultExpandAllRows
                  scroll={{ x: 'max-content' }}
                  tableLayout="fixed"
                  size="small"
                />
              )}
            </div>

            <div className="domain-section">
              <SectionTitle title="数据权限规则" />
              <div className="permission-config">
                <Table
                  columns={permissionColumns}
                  dataSource={dataPermissions}
                  pagination={false}
                  size="small"
                />
                <CompanyButton type="dashed" block onClick={handleAddPermission} style={{ marginTop: 8 }}>
                  + 添加规则
                </CompanyButton>
              </div>
            </div>
          </CompanyCard>
        </div>

        <FormFooterActions
          submitLoading={submitLoading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitText="确定"
        />
      </div>

      <CompanyDrawer
        open={drawerVisible}
        title="添加菜单"
        width={380}
        placement="right"
        footerStyle={{ textAlign: 'right' }}
        onClose={closeDrawer}
        footer={
          <>
            <CompanyButton onClick={closeDrawer}>取消</CompanyButton>
            <CompanyButton type="primary" onClick={confirmSelection} style={{ marginLeft: 8 }}>
              确认 ({checkedCount})
            </CompanyButton>
          </>
        }
      >
        <div className="drawer-content">
          <div className="drawer-search">
            <Input
              value={menuSearchKeyword}
              onChange={e => setMenuSearchKeyword(e.target.value)}
              placeholder="搜索菜单"
              allowClear
              prefix={<SearchOutlined />}
            />
          </div>
          <div className="drawer-tree">
            <Tree
              treeData={filteredTreeData}
              expandedKeys={expandedKeys}
              checkable
              fieldNames={{ children: 'children', title: 'label', key: 'id' }}
              onExpand={onExpand}
              onCheck={onCheck}
            />
          </div>
        </div>
      </CompanyDrawer>

      <CompanyDrawer
        open={moveDrawerVisible}
        title="移动菜单"
        width={380}
        placement="right"
        footerStyle={{ textAlign: 'right' }}
        onClose={closeMoveDrawer}
        footer={
          <>
            <CompanyButton onClick={closeMoveDrawer}>取消</CompanyButton>
            <CompanyButton
              type="primary"
              onClick={confirmMove}
              disabled={selectedMoveTargetId === null}
              style={{ marginLeft: 8 }}
            >
              确认移动
            </CompanyButton>
          </>
        }
      >
        {moveTargetRecord && (
          <div className="move-drawer-content">
            <div className="move-tip">
              将「{moveTargetRecord.menuName}」移动至：
            </div>
            <div className="move-tree-container">
              <div
                className={`move-tree-node${selectedMoveTargetId === 0 ? ' move-tree-node-selected' : ''}`}
                onClick={() => setSelectedMoveTargetId(0)}
              >
                <span className="move-tree-node-label">一级菜单</span>
              </div>
              {moveTreeData.length > 0 ? (
                <Tree
                  treeData={moveTreeData}
                  expandedKeys={moveExpandedKeys}
                  selectedKeys={selectedMoveTargetId !== null && selectedMoveTargetId !== 0 ? [String(selectedMoveTargetId)] : []}
                  blockNode
                  selectable
                  showIcon={false}
                  titleRender={moveTreeTitleRender}
                  fieldNames={{ children: 'children', title: 'label', key: 'key' }}
                  onSelect={onMoveTreeSelect}
                  onExpand={onMoveTreeExpand}
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
