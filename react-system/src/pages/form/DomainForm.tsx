import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tree, Input, Select, InputNumber, Table, Alert, Empty, Menu } from 'antd'
import { SearchOutlined, DownOutlined } from '@ant-design/icons'
import { CompanyButton, CompanyCard, CompanyDrawer, CompanyDropdown, CompanyMessage, FormPageTemplate, SectionTitle } from '@donglegeyu/company-ui'
import BaseInfoForm, { type BaseInfoFormRef } from '@/components/BaseInfoForm'
import IconSelect from '@/components/IconSelect'
import { pinyin } from 'pinyin-pro'
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
  id?: number
  domainId: number
  menuId: number
  customLabel: string
  sort: number
  originalLabel: string
  status: number
  customParentId: number | null
  customLevel: number | null
  icon?: string
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
  const [menuStatusMap, setMenuStatusMap] = useState<Map<number, number>>(new Map())

  const baseInfoFormRef = useRef<BaseInfoFormRef>(null)

  const [drawerVisible, setDrawerVisible] = useState(false)
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false)
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
    return pinyin(domainName, { toneType: 'none', type: 'array' })
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
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
        setMenuStatusMap(prev => {
          const next = new Map(prev)
          ;(json.data || []).forEach((m: any) => {
            if (!next.has(Number(m.menuId))) {
              next.set(Number(m.menuId), Number(m.status ?? 1))
            }
          })
          return next
        })
        const menus: DomainMenu[] = (json.data || []).map((m: any) => {
          const menuId = Number(m.menuId)
          const sysMenu = sysMenuMap.get(menuId)
          return {
            id: m.id ? Number(m.id) : undefined,
            domainId: Number(m.domainId ?? 0),
            menuId,
            customLabel: m.customLabel || '',
            sort: Number(m.sort ?? 0),
            originalLabel: sysMenu?.label || '',
            status: Number(m.status ?? 1),
            customParentId: m.customParentId != null ? Number(m.customParentId) : null,
            customLevel: m.customLevel != null ? Number(m.customLevel) : null,
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
    if (domainMenus.length === 0) return []

    function getSystemMenu(menus: SystemMenu[], id: number): SystemMenu | undefined {
      for (const menu of menus) {
        if (menu.id === id) return menu
        if (menu.children?.length) {
          const found = getSystemMenu(menu.children, id)
          if (found) return found
        }
      }
      return undefined
    }

    function getSystemParentId(menuId: number): number {
      const sysMenu = getSystemMenu(systemMenus, menuId)
      return sysMenu?.parentId ?? 0
    }

    function getEffectiveParentId(dm: DomainMenu): number | null {
      if (dm.customParentId != null) {
        return dm.customParentId
      }
      const sysParentId = getSystemParentId(dm.menuId)
      if (sysParentId === 0) return null
      const parentDomainMenu = domainMenus.find(d => d.menuId === sysParentId)
      if (parentDomainMenu?.id) return parentDomainMenu.id
      return null
    }

    const buildTree = (parentId: number | null, depth: number): any[] => {
      return domainMenus
        .filter(dm => getEffectiveParentId(dm) === parentId)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map(dm => {
          const sysMenu = getSystemMenu(systemMenus, dm.menuId)

          if (!menuStatusMap.has(dm.menuId)) {
            setMenuStatusMap(prev => {
              const next = new Map(prev)
              next.set(dm.menuId, dm.status)
              return next
            })
          }

          const children = buildTree(dm.id ?? dm.menuId, depth + 1)

          return {
            key: dm.menuId,
            menuId: dm.menuId,
            parentId: getEffectiveParentId(dm),
            menuName: dm.customLabel || dm.originalLabel || sysMenu?.label || '',
            menuLevel: depth,
            status: menuStatusMap.get(dm.menuId) ?? dm.status,
            icon: dm.icon || sysMenu?.icon || 'folder',
            sort: dm.sort || 0,
            originalLabel: sysMenu?.label || '',
            ...(children.length > 0 ? { children } : {}),
          }
        })
    }

    return buildTree(null, 1)
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
      let nextId = Math.max(0, ...prev.map(m => m.id ?? 0)) + 1
      checkedKeys.forEach(id => {
        const menuId = Number(id)
        if (!existingMenuIds.has(menuId)) {
          const sysMenu = sysMenuMap.get(menuId)
          const parentResult = findParentAndLevel(systemMenus, menuId)
          const sysParentMenuId = parentResult?.parentId || 0
          let customParentId: number | null = null
          if (sysParentMenuId !== 0) {
            const parentDomainMenu = prev.find(d => d.menuId === sysParentMenuId)
            if (parentDomainMenu?.id) customParentId = parentDomainMenu.id
          }
          newMenus.push({
            id: nextId++,
            domainId: 0,
            menuId,
            customLabel: '',
            sort: newMenus.length,
            originalLabel: sysMenu?.label || '',
            status: 1,
            customParentId,
            customLevel: parentResult?.level || null,
            icon: sysMenu?.icon || '',
          })
        }
      })
      setMenuStatusMap(prevMap => {
        const next = new Map(prevMap)
        newMenus.forEach(m => {
          if (!next.has(m.menuId)) next.set(m.menuId, m.status)
        })
        return next
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
    setMenuStatusMap(prev => {
      const next = new Map(prev)
      next.set(record.menuId, status)
      return next
    })
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
    const removedId = domainMenus.find(m => m.menuId === record.menuId)?.id
    setDomainMenus(prev =>
      prev
        .filter(m => m.menuId !== record.menuId)
        .map(m => m.customParentId != null && m.customParentId === removedId ? { ...m, customParentId: null } : m)
    )
  }

  function handleResetMenus() {
    setMoreDropdownOpen(false)
    const sysMenuMap = collectAllMenus(systemMenus)
    setDomainMenus(prev =>
      prev.map(m => {
        const sysMenu = sysMenuMap.get(m.menuId)
        if (sysMenu) {
          return { ...m, customLabel: sysMenu.label }
        }
        return m
      })
    )
    CompanyMessage.success('已重置菜单名称为系统默认，保存后生效')
  }

  function handleResetIcons() {
    setMoreDropdownOpen(false)
    const sysMenuMap = collectAllMenus(systemMenus)
    setDomainMenus(prev =>
      prev.map(m => {
        const sysMenu = sysMenuMap.get(m.menuId)
        return { ...m, icon: sysMenu?.icon || '' }
      })
    )
    CompanyMessage.success('已重置图标为系统默认，保存后生效')
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

  function confirmMove() {
    if (!moveTargetRecord || selectedMoveTargetId === null) return

    setDomainMenus(prev => {
      const targetDomainMenu = prev.find(m => m.menuId === moveTargetRecord.menuId)
      if (!targetDomainMenu) return prev

      let newCustomParentId: number | null = null
      let newCustomLevel: number | null = null

      if (selectedMoveTargetId === 0) {
        newCustomParentId = null
        newCustomLevel = 1
      } else {
        const parentDomainMenu = prev.find(m => m.menuId === selectedMoveTargetId)
        if (parentDomainMenu) {
          newCustomParentId = parentDomainMenu.id ?? null
          const parentLevel = parentDomainMenu.customLevel ?? (() => {
            const sysMenu = (() => {
              function find(menus: SystemMenu[], id: number): SystemMenu | undefined {
                for (const menu of menus) {
                  if (menu.id === id) return menu
                  if (menu.children?.length) {
                    const found = find(menu.children, id)
                    if (found) return found
                  }
                }
                return undefined
              }
              return find(systemMenus, parentDomainMenu.menuId)
            })()
            return sysMenu ? (sysMenu as any).level ?? 1 : 1
          })()
          newCustomLevel = parentLevel + 1
        }
      }

      const updated = prev.map(m => {
        if (m.menuId === moveTargetRecord.menuId) {
          return { ...m, customParentId: newCustomParentId, customLevel: newCustomLevel }
        }
        return m
      })

      function walkChildren(parentMenuId: number, parentLevel: number) {
        const parentDomainMenu = updated.find(m => m.menuId === parentMenuId)
        const parentId = parentDomainMenu?.id
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].customParentId === parentId && updated[i].menuId !== parentMenuId) {
            updated[i] = { ...updated[i], customLevel: parentLevel + 1 }
            walkChildren(updated[i].menuId, parentLevel + 1)
          }
        }
      }
      walkChildren(moveTargetRecord.menuId, newCustomLevel ?? 1)

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
            customLevel: m.customLevel,
            customParentId: m.customParentId,
            sort: m.sort || i + 1,
          }))),
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
      ])
    }
  }, [isEdit, params.id, systemMenus, fetchDomain, fetchDomainMenus])

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
    <>
    <FormPageTemplate
      title={pageTitle}
      showBack
      onBack={() => navigate('/domain-manage')}
      submitLoading={submitLoading}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitText="确定"
    >
      <div className="domain-section">
        <SectionTitle title="基础信息" />
        <div className="basic-info-form">
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
          />
        </div>
      </div>

      <div className="domain-section">
        <SectionTitle title={`域内菜单配置${formData.isDefault !== 1 ? ' (' + domainMenus.length + ')' : ''}`} />
        {formData.isDefault === 1 ? (
          <div style={{ marginBottom: 16 }}>
            <Alert type="warning" showIcon message="默认域的域内菜单配置禁止修改，菜单数量、层级等与菜单管理的数据始终保持一致" />
          </div>
        ) : (
          <div className="menu-config-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CompanyButton type="text" style={{ color: 'var(--ant-color-primary)', paddingLeft: 8, paddingRight: 8 }} onClick={() => setDrawerVisible(true)}>
              添加菜单
            </CompanyButton>
            <CompanyDropdown
              open={moreDropdownOpen}
              onOpenChange={setMoreDropdownOpen}
              popupRender={() => (
                <Menu
                  onClick={({ key }) => {
                    if (key === 'reset-menus') handleResetMenus()
                    if (key === 'reset-icons') handleResetIcons()
                  }}
                  items={[
                    {
                      key: 'reset-menus',
                      label: '重置菜单',
                    },
                    {
                      key: 'reset-icons',
                      label: '重置图标',
                    },
                  ]}
                  style={{ minWidth: 120 }}
                />
              )}
            >
              <CompanyButton type="text" style={{ color: 'var(--ant-color-primary)', paddingLeft: 8, paddingRight: 8 }}>
                重置 <DownOutlined style={{ fontSize: 12 }} />
              </CompanyButton>
            </CompanyDropdown>
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
    </FormPageTemplate>

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
    </>
  )
}
