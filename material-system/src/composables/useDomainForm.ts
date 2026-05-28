import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import { API_ENDPOINTS } from '@/constants/api'
import type { Domain, SystemMenu, DomainMenu, DataPermission, DomainFormData } from '@/types'

interface MenuTreeNode {
  key: number
  menuId: number
  menuName: string
  menuLevel: number
  status: number
  icon: string
  sort: number
  originalLabel?: string
  children?: MenuTreeNode[]
}

export function useDomainForm() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const submitLoading = ref(false)

  const formData = reactive<DomainFormData>({
    domainKey: '',
    domainName: '',
    description: '',
    status: 1
  })

  const systemMenus = ref<SystemMenu[]>([])
  const domainMenus = ref<DomainMenu[]>([])
  const dataPermissions = ref<DataPermission[]>([])
  const menuSearchKeyword = ref('')
  const expandedKeys = ref<number[]>([])

  const drawerVisible = ref(false)
  const selectedMenuIdsInDrawer = ref<number[]>([])

  // 新增：菜单状态映射
  const menuStatusMap = ref<Map<number, number>>(new Map())

  async function fetchSystemMenus() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(API_ENDPOINTS.NAV_MENUS)
      const json = await res.json()
      if (json.code === 200) {
        systemMenus.value = json.data || []
      } else {
        throw new Error(json.message || '加载系统菜单失败')
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载系统菜单失败'
      error.value = errorMessage
      message.error(errorMessage)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDomainMenus(domainId: number) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_ENDPOINTS.DOMAIN_MENUS}?domainId=${domainId}`)
      const json = await res.json()
      if (json.code === 200) {
        domainMenus.value = (json.data || []).map((m: DomainMenu) => {
          const sysMenu = systemMenus.value.find(s => s.id === m.menuId)
          // 初始化菜单状态
          if (!menuStatusMap.value.has(m.menuId)) {
            menuStatusMap.value.set(m.menuId, m.status ?? 1)
          }
          // 如果后端没有返回 parentId，根据系统菜单结构推断
          let parentId = m.parentId ?? 0
          let menuLevel = m.menuLevel
          
          if (parentId === 0 && !menuLevel) {
            // 在系统菜单中查找该菜单的父菜单
            const findParentAndLevel = (menus: SystemMenu[], targetId: number, level: number = 1): { parentId: number, level: number } | null => {
              for (const menu of menus) {
                if (menu.id === targetId) {
                  return { parentId: 0, level }
                }
                if (menu.children?.length) {
                  for (const child of menu.children) {
                    if (child.id === targetId) {
                      return { parentId: menu.id, level: level + 1 }
                    }
                    const found = findParentAndLevel([child], targetId, level + 1)
                    if (found) return found
                  }
                }
              }
              return null
            }
            const result = findParentAndLevel(systemMenus.value, m.menuId)
            if (result) {
              parentId = result.parentId
              menuLevel = result.level
            }
          }
          
          return {
            ...m,
            parentId,
            menuLevel: menuLevel ?? 1,
            originalLabel: sysMenu?.label || ''
          }
        })
      } else {
        throw new Error(json.message || '加载域菜单失败')
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载域菜单失败'
      error.value = errorMessage
      message.error(errorMessage)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDataPermissions(domainId: number) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_ENDPOINTS.DATA_PERMISSIONS}?domainId=${domainId}`)
      const json = await res.json()
      if (json.code === 200) {
        dataPermissions.value = json.data || []
      } else {
        throw new Error(json.message || '加载数据权限失败')
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载数据权限失败'
      error.value = errorMessage
      message.error(errorMessage)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDomain(domainId: number) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_ENDPOINTS.DOMAINS}/${domainId}`)
      const json = await res.json()
      if (json.code === 200 && json.data) {
        // 直接更新 reactive 对象的每个属性
        formData.domainKey = json.data.domainKey
        formData.domainName = json.data.domainName
        formData.description = json.data.description || ''
        formData.status = json.data.status
        formData.isDefault = json.data.isDefault
      } else {
        throw new Error(json.message || '加载域详情失败')
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载域详情失败'
      error.value = errorMessage
      message.error(errorMessage)
      throw e
    } finally {
      loading.value = false
    }
  }

  function openDrawer() {
    selectedMenuIdsInDrawer.value = domainMenus.value.map(m => m.menuId)
    drawerVisible.value = true
  }

  function closeDrawer() {
    drawerVisible.value = false
  }

  function removeMenu(index: number) {
    domainMenus.value.splice(index, 1)
  }

  function updateMenuCustomLabel(index: number, value: string) {
    domainMenus.value[index].customLabel = value
  }

  function updateMenuSort(index: number, value: number) {
    domainMenus.value[index].sort = value
  }

  // 新增：设置菜单状态
  function setMenuStatus(menuId: number, status: number) {
    menuStatusMap.value.set(menuId, status)
    // 同时更新 domainMenus 中的状态
    const menu = domainMenus.value.find(m => m.menuId === menuId)
    if (menu) {
      menu.status = status
    }
  }

  const menuTreeData = computed<MenuTreeNode[]>(() => {
    // 根据 domainMenus 的 parentId 构建树结构
    const buildTreeFromDomainMenus = (parentId: number = 0): MenuTreeNode[] => {
      const result: MenuTreeNode[] = []
      
      // 找到所有属于当前父菜单的域菜单
      const children = domainMenus.value.filter(dm => dm.parentId === parentId)
      
      for (const domainMenu of children) {
        // 在系统菜单中查找对应的信息
        const systemMenu = findSystemMenuById(systemMenus.value, domainMenu.menuId)
        
        if (!menuStatusMap.value.has(domainMenu.menuId)) {
          menuStatusMap.value.set(domainMenu.menuId, domainMenu.status ?? 1)
        }
        
        const node: MenuTreeNode = {
          key: domainMenu.menuId,
          menuId: domainMenu.menuId,
          menuName: domainMenu.customLabel || domainMenu.originalLabel || systemMenu?.label || '',
          menuLevel: domainMenu.menuLevel ?? 1,
          status: menuStatusMap.value.get(domainMenu.menuId) ?? 1,
          icon: domainMenu.icon || systemMenu?.icon || 'folder',
          sort: domainMenu.sort || 0,
          originalLabel: systemMenu?.label || ''
        }
        
        // 递归构建子菜单
        const childNodes = buildTreeFromDomainMenus(domainMenu.menuId)
        if (childNodes.length > 0) {
          node.children = childNodes
        }
        
        result.push(node)
      }
      
      return result
    }
    
    return buildTreeFromDomainMenus(0)
  })
  
  // 辅助函数：在系统菜单树中查找指定ID的菜单
  function findSystemMenuById(menus: SystemMenu[], id: number): SystemMenu | undefined {
    for (const menu of menus) {
      if (menu.id === id) return menu
      if (menu.children?.length) {
        const found = findSystemMenuById(menu.children, id)
        if (found) return found
      }
    }
    return undefined
  }

  function addPermission() {
    dataPermissions.value.push({
      domainId: 0,
      menuKey: '',
      filterType: 'all',
      filterField: '',
      filterValue: ''
    })
  }

  function removePermission(index: number) {
    dataPermissions.value.splice(index, 1)
  }

  async function submitDomain(isEdit: boolean, domainId?: number) {
    if (!formData.domainKey || !formData.domainName) {
      message.warning('请填写必填项')
      return false
    }

    submitLoading.value = true
    error.value = null

    try {
      let finalDomainId = domainId

      if (isEdit && domainId) {
        await fetch(`${API_ENDPOINTS.DOMAINS}/${domainId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
      } else {
        const res = await fetch(API_ENDPOINTS.DOMAINS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        const json = await res.json()
        if (json.code === 200 && json.data) {
          finalDomainId = typeof json.data === 'number' ? json.data : json.data.id
        }
      }

      if (finalDomainId && (formData as any).isDefault !== 1) {
        await fetch(API_ENDPOINTS.DOMAIN_MENUS_BATCH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(domainMenus.value.map((m, i) => ({
            domainId: finalDomainId,
            menuId: m.menuId,
            customLabel: m.customLabel,
            sort: m.sort || i + 1,
            status: m.status ?? menuStatusMap.value.get(m.menuId) ?? 1
          })))
        })

        await fetch(API_ENDPOINTS.DATA_PERMISSIONS_BATCH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataPermissions.value.map(p => ({
            ...p,
            domainId: finalDomainId
          })))
        })
      } else if (finalDomainId && (formData as any).isDefault === 1) {
        message.warning('默认域的域内菜单配置禁止修改')
        return false
      }

      message.success(isEdit ? '更新成功' : '创建成功')
      return true
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '操作失败'
      error.value = errorMessage
      message.error(errorMessage)
      return false
    } finally {
      submitLoading.value = false
    }
  }

  function generateDomainKey(domainName: string) {
    return domainName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  function resetForm() {
    Object.assign(formData, {
      domainKey: '',
      domainName: '',
      description: '',
      status: 1
    })
    domainMenus.value = []
    dataPermissions.value = []
    menuSearchKeyword.value = ''
    expandedKeys.value = []
    drawerVisible.value = false
    selectedMenuIdsInDrawer.value = []
    menuStatusMap.value.clear()
    error.value = null
  }

  return {
    formData,
    systemMenus,
    domainMenus,
    dataPermissions,
    menuSearchKeyword,
    expandedKeys,
    menuTreeData,
    drawerVisible,
    menuStatusMap,
    loading,
    error,
    submitLoading,
    fetchSystemMenus,
    fetchDomainMenus,
    fetchDataPermissions,
    fetchDomain,
    openDrawer,
    closeDrawer,
    removeMenu,
    updateMenuCustomLabel,
    updateMenuSort,
    addPermission,
    removePermission,
    submitDomain,
    generateDomainKey,
    resetForm,
    setMenuStatus
  }
}
