<template>
  <div class="domain-form">
    <PageTitle :title="pageTitle" showBack backPath="/domain-manage" class="domain-page-title" />
    <div class="domain-wrapper">
      <div class="domain-container" :class="{ scrolling: isScrolling }" @scroll="handleScroll">
        <a-card class="domain-main-card">
          <div class="domain-section">
            <SectionTitle title="基础信息" />
            <BaseInfoForm
              ref="baseInfoFormRef"
              v-model="formData"
              :fields="baseInfoFields"
              layout="horizontal"
              @fieldChange="handleBaseInfoFieldChange"
            />
          </div>

          <div class="domain-section">
            <SectionTitle :title="`域内菜单配置${formData.isDefault !== 1 ? ' (' + domainMenus.length + ')' : ''}`" />
          <div v-if="formData.isDefault === 1" style="margin-bottom: 16px;">
            <a-alert type="warning" show-icon message="默认域的域内菜单配置禁止修改，菜单数量、层级等与菜单管理的数据始终保持一致" />
          </div>
          <div v-else class="menu-config-header">
            <a-button type="primary" @click="openDrawer">
              添加菜单
            </a-button>
          </div>

          <a-table
            v-if="formData.isDefault !== 1"
            class='domain-table-box'
            :columns="menuColumns"
            :data-source="menuTreeData"
            :pagination="false"
            :row-key="(record: any) => record.key"
            :default-expand-all="true"
            :scroll="{ x: 'max-content' }"
            table-layout="fixed"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'menuName'">
                <div class="menu-name-cell">
                  <a-input
                    v-model:value="record.menuName"
                    placeholder="自定义名称"
                    size="middle"
                    class="menu-name-input"
                    :style="{ width: '100%' }"
                    @blur="handleMenuNameChange(record)"
                  />
                </div>
              </template>
              <template v-else-if="column.key === 'menuLevel'">
                <a-input
                  :value="['一级', '二级', '三级'][record.menuLevel - 1] || '三级'"
                  disabled
                  size="middle"
                  style="width: 100%"
                />
              </template>
              <template v-else-if="column.key === 'status'">
                <a-select
                  v-model:value="record.status"
                  :options="statusOptions"
                  size="middle"
                  style="width: 100%"
                  @change="(value: any) => handleStatusChange(record, value as number)"
                />
              </template>
              <template v-else-if="column.key === 'icon'">
                <IconSelect
                  v-model="record.icon"
                  placeholder="选择图标"
                  size="middle"
                  style="width: 120px"
                />
              </template>
              <template v-else-if="column.key === 'sort'">
                <a-input-number
                  v-model:value="record.sort"
                  :min="0"
                  size="middle"
                  style="width: 100%"
                  @change="handleSortChange(record)"
                />
              </template>
              <template v-else-if="column.key === 'action'">
                <div style="width: 120px; display: flex; gap: 8px;">
                  <a-button
                    type="link"
                    size="small"
                    @click="openMoveDrawer(record)"
                  >
                    移动
                  </a-button>
                  <a-button
                    type="link"
                    danger
                    size="small"
                    @click="handleRemoveMenu(record)"
                  >
                    移除
                  </a-button>
                </div>
              </template>
            </template>
          </a-table>
          </div>

          <div class="domain-section">
            <SectionTitle title="数据权限规则" />
          <div class="permission-config">
            <a-table
              :columns="permissionColumns"
              :data-source="dataPermissions"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'menuKey'">
                  <a-select v-model:value="record.menuKey" placeholder="选择菜单" style="width: 100%">
                    <a-select-option v-for="menu in domainMenus" :key="menu.menuId" :value="menu.menuId">
                      {{ menu.customLabel || menu.originalLabel }}
                    </a-select-option>
                  </a-select>
                </template>
                <template v-else-if="column.key === 'filterType'">
                  <a-select v-model:value="record.filterType" style="width: 100%">
                    <a-select-option value="all">全部</a-select-option>
                    <a-select-option value="self">仅本人</a-select-option>
                    <a-select-option value="custom">自定义</a-select-option>
                  </a-select>
                </template>
                <template v-else-if="column.key === 'filterField'">
                  <a-input v-model:value="record.filterField" placeholder="过滤字段" />
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-button type="link" danger size="small" @click="handleRemovePermission(index)">
                    删除
                  </a-button>
                </template>
              </template>
            </a-table>
            <a-button type="dashed" block @click="handleAddPermission" style="margin-top: 8px">
              + 添加规则
            </a-button>
          </div>
          </div>
        </a-card>
      </div>

      <FormFooterActions
        :submitLoading="submitLoading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>

    <a-drawer
      v-model:open="drawerVisible"
      title="添加菜单"
      width="380"
      placement="right"
      :footer-style="{ textAlign: 'right' }"
      @close="closeDrawer"
    >
      <div class="drawer-content">
        <div class="drawer-search">
          <a-input v-model:value="menuSearchKeyword" placeholder="搜索菜单" allow-clear>
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </div>
        <div class="drawer-tree">
          <a-tree
            :tree-data="filteredTreeData"
            :expanded-keys="expandedKeys"
            :checkable="true"
            :field-names="{ children: 'children', title: 'label', key: 'id' }"
            @expand="onExpand"
            @check="onCheck"
          />
        </div>
      </div>
      <template #footer>
        <a-button @click="closeDrawer">取消</a-button>
        <a-button type="primary" @click="confirmSelection" style="margin-left: 8px">
          确认 ({{ checkedCount }})
        </a-button>
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="moveDrawerVisible"
      title="移动菜单"
      width="380"
      placement="right"
      :footer-style="{ textAlign: 'right' }"
      @close="closeMoveDrawer"
    >
      <div v-if="moveTargetRecord" class="move-drawer-content">
        <div class="move-tip">
          将「{{ moveTargetRecord.menuName }}」移动至：
        </div>
        <div class="move-tree-container">
          <div
            class="move-tree-node"
            :class="{ 'move-tree-node-selected': selectedMoveTargetId === 0 }"
            @click="selectedMoveTargetId = 0"
          >
            <span class="move-tree-node-label">一级菜单</span>
          </div>
          <a-tree
            v-if="moveTreeData.length"
            :tree-data="moveTreeData"
            :expanded-keys="moveExpandedKeys"
            :selected-keys="selectedMoveTargetId !== null && selectedMoveTargetId !== 0 ? [String(selectedMoveTargetId)] : []"
            :block-node="true"
            :selectable="true"
            :show-icon="false"
            @select="onMoveTreeSelect"
            @expand="onMoveTreeExpand"
          >
            <template #title="{ dataRef }">
              <span :class="{ 'tree-node-disabled': dataRef.disabled }">
                {{ dataRef.label }}
                <span v-if="dataRef.disabled" :style="{ color: 'var(--color-text-disabled)', fontSize: '12px' }">（超出层级）</span>
              </span>
            </template>
          </a-tree>
          <a-empty v-else description="暂无数据" />
        </div>
      </div>
      <template #footer>
        <a-button @click="closeMoveDrawer">取消</a-button>
        <a-button type="primary" @click="confirmMove" :disabled="selectedMoveTargetId === null" style="margin-left: 8px">确认移动</a-button>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'
import PageTitle from '@/components/PageTitle.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import IconSelect from '@/components/IconSelect.vue'
import BaseInfoForm from '@/components/BaseInfoForm.vue'
import FormFooterActions from '@/components/FormFooterActions.vue'
import { useDomainForm } from '@/composables/useDomainForm'
import type { SystemMenu } from '@/types'

interface MoveTreeNode {
  key: string
  label: string
  disabled: boolean
  children?: MoveTreeNode[]
}

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const pageTitle = computed(() => isEdit.value ? '编辑域' : '新增域')

const {
  formData,
  systemMenus,
  domainMenus,
  dataPermissions,
  menuSearchKeyword,
  expandedKeys,
  menuTreeData,
  drawerVisible,
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
  generateDomainKey
} = useDomainForm()

const statusOptions = [
  { value: 1, label: '启用' },
  { value: 0, label: '禁用' }
]

function handleStatusChange(record: any, status: number) {
  const menu = domainMenus.value.find(m => m.menuId === record.menuId)
  if (menu) {
    menu.status = status
  }
}

const checkedKeys = ref<string[]>([])
const checkedCount = computed(() => checkedKeys.value.length)

const moveDrawerVisible = ref(false)
const moveTargetRecord = ref<any>(null)
const selectedMoveTargetId = ref<number | null>(null)
const moveExpandedKeys = ref<string[]>([])
const moveTreeData = ref<MoveTreeNode[]>([])

const filteredTreeData = computed(() => {
  const addedMenuIds = new Set(domainMenus.value.map(m => m.menuId))
  
  const filter = (menus: SystemMenu[]): SystemMenu[] => {
    return menus.filter(menu => {
      // 跳过已经添加的菜单
      if (addedMenuIds.has(menu.id)) return false
      
      const match = menuSearchKeyword.value 
        ? menu.label.toLowerCase().includes(menuSearchKeyword.value.toLowerCase())
        : true
      const children = menu.children ? filter(menu.children) : []
      
      if (match || children.length > 0) {
        return { ...menu, children }
      }
      return false
    }).map(menu => ({
      ...menu,
      children: menu.children ? filter(menu.children) : []
    }))
  }
  
  return filter(systemMenus.value) as any
})

const baseInfoFormRef = ref()

const menuColumns = [
  { title: '菜单名称', key: 'menuName', width: 360, ellipsis: true },
  { title: '菜单层级', key: 'menuLevel' },
  { title: '状态', key: 'status' },
  { title: '图标', key: 'icon' },
  { title: '排序', key: 'sort', width: 160 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

const permissionColumns = [
  { title: '菜单', key: 'menuKey', width: 200 },
  { title: '过滤类型', key: 'filterType', width: 120 },
  { title: '过滤字段', key: 'filterField', width: 150 },
  { title: '操作', key: 'action', width: 80 }
]

const baseInfoFields = [
  {
    name: 'domainName',
    label: '域名称',
    type: 'input' as const,
    required: true,
    rules: [
      { required: true, message: '请输入域名称', trigger: 'blur' },
      { max: 50, message: '域名称不能超过50个字符', trigger: 'blur' }
    ]
  },
  {
    name: 'domainKey',
    label: '域标识',
    type: 'input' as const,
    placeholder: '根据域名称自动生成',
    readonly: true,
    required: true,
    rules: [
      { required: true, message: '域标识自动生成', trigger: 'blur' },
      { max: 100, message: '域标识不能超过100个字符', trigger: 'blur' }
    ]
  },
  {
    name: 'status',
    label: '状态',
    type: 'select' as const,
    options: [
      { value: 1, label: '启用' },
      { value: 0, label: '禁用' }
    ]
  },
  {
    name: 'description',
    label: '描述',
    type: 'textarea' as const,
    rules: [
      { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
    ]
  }
]

function handleBaseInfoFieldChange(field: string, value: any) {
  if (field === 'domainName' && !isEdit.value && value) {
    formData.domainKey = generateDomainKey(value)
  }
}

function onExpand(keys: (string | number)[]) {
  expandedKeys.value = keys.map(k => Number(k))
}

function onCheck(checked: any) {
  if (Array.isArray(checked)) {
    checkedKeys.value = checked
  } else {
    checkedKeys.value = checked.checked || []
  }
}

function confirmSelection() {
  const sysMenuMap = new Map<number, SystemMenu>()
  const collectMenus = (menus: SystemMenu[]) => {
    menus.forEach(m => {
      sysMenuMap.set(m.id, m)
      if (m.children) collectMenus(m.children)
    })
  }
  collectMenus(systemMenus.value)
  
  // 获取已存在的菜单ID集合
  const existingMenuIds = new Set(domainMenus.value.map(m => m.menuId))
  
  // 只添加新选择的菜单
  checkedKeys.value.forEach(id => {
    const menuId = Number(id)
    if (!existingMenuIds.has(menuId)) {
      const sysMenu = sysMenuMap.get(menuId)
      domainMenus.value.push({
        domainId: 0,
        menuId,
        customLabel: '',
        sort: domainMenus.value.length,
        originalLabel: sysMenu?.label || ''
      })
    }
  })
  
  checkedKeys.value = []
  closeDrawer()
}

function handleMenuNameChange(record: any) {
  const menu = domainMenus.value.find(m => m.menuId === record.menuId)
  if (menu) {
    updateMenuCustomLabel(domainMenus.value.indexOf(menu), record.menuName)
  }
}

function handleSortChange(record: any) {
  const menu = domainMenus.value.find(m => m.menuId === record.menuId)
  if (menu) {
    updateMenuSort(domainMenus.value.indexOf(menu), record.sort)
  }
}

function handleRemoveMenu(record: any) {
  const index = domainMenus.value.findIndex(m => m.menuId === record.menuId)
  if (index >= 0) {
    removeMenu(index)
  }
}

function handleAddPermission() {
  addPermission()
}

function handleRemovePermission(index: number) {
  removePermission(index)
}

function handleCancel() {
  router.push('/domain-manage')
}

async function handleSubmit() {
  const valid = await baseInfoFormRef.value?.validate()
  if (!valid) return

  const domainId = isEdit.value ? Number(route.params.id) : undefined
  const success = await submitDomain(isEdit.value, domainId)

  if (success) {
    router.push('/domain-manage')
  }
}

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

  const selectedMenuIdStrs = new Set(domainMenus.value.map(m => String(m.menuId)))
  const excludedIds = new Set([String(record.menuId)])

  const traverse = (items: SystemMenu[]): MoveTreeNode[] => {
    const nodes: MoveTreeNode[] = []

    for (const item of items) {
      const itemIdStr = String(item.id)

      if (excludedIds.has(itemIdStr)) {
        continue
      }

      // 跳过非业务菜单（根据实际需求调整）
      // if (!item.menuType || item.menuType !== '业务菜单') {
      //   continue
      // }

      const childrenNodes = item.children?.length ? traverse(item.children) : undefined

      const hasSelectedDescendant = childrenNodes && childrenNodes.length > 0
      const isSelected = selectedMenuIdStrs.has(itemIdStr)

      if (!isSelected && !hasSelectedDescendant) {
        continue
      }

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
      const targetMenuLevel = findLevel(systemMenus.value, item.id)

      const newLevelAfterMove = targetMenuLevel
      const wouldExceed = newLevelAfterMove + maxSubLevel > 3
      const disabled = wouldExceed

      const node: MoveTreeNode = {
        key: itemIdStr,
        label: item.label,
        disabled,
        children: childrenNodes,
      }

      nodes.push(node)
    }

    return nodes
  }

  const treeData = traverse(systemMenus.value)

  return treeData
}

function onMoveTreeSelect(selectedKeys: (string | number)[]) {
  if (selectedKeys.length > 0) {
    const key = selectedKeys[0]
    const node = findMoveTreeNode(moveTreeData.value, String(key))
    if (!node || !node.disabled) {
      selectedMoveTargetId.value = Number(key)
    }
  }
}

function onMoveTreeExpand(keys: (string | number)[]) {
  moveExpandedKeys.value = keys as string[]
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
  moveTargetRecord.value = record
  selectedMoveTargetId.value = null
  moveTreeData.value = buildMoveTreeData(record)
  moveExpandedKeys.value = systemMenus.value.map((item) => String(item.id))
  moveDrawerVisible.value = true
}

function closeMoveDrawer() {
  moveDrawerVisible.value = false
  moveTargetRecord.value = null
  selectedMoveTargetId.value = null
  moveTreeData.value = []
  moveExpandedKeys.value = []
}

async function confirmMove() {
  if (!moveTargetRecord.value || selectedMoveTargetId.value === null) return

  const record = moveTargetRecord.value
  const newParentId = selectedMoveTargetId.value

  const menu = domainMenus.value.find(m => m.menuId === record.menuId)
  if (menu) {
    menu.parentId = newParentId
    
    // 计算新的菜单层级
    if (newParentId === 0) {
      // 移动到一级菜单
      menu.menuLevel = 1
    } else {
      // 根据父菜单计算层级
      const parentMenu = domainMenus.value.find(m => m.menuId === newParentId)
      if (parentMenu) {
        menu.menuLevel = (parentMenu.menuLevel || 1) + 1
      } else {
        // 在系统菜单中查找父菜单
        const findParentLevel = (menus: SystemMenu[], targetId: number, level: number = 1): number => {
          for (const m of menus) {
            if (m.id === targetId) return level
            if (m.children?.length) {
              const found = findParentLevel(m.children, targetId, level + 1)
              if (found > 0) return found
            }
          }
          return 0
        }
        const parentLevel = findParentLevel(systemMenus.value, newParentId)
        menu.menuLevel = parentLevel > 0 ? parentLevel + 1 : 1
      }
    }
    
    // 递归更新子菜单的层级
    updateChildrenLevel(menu.menuId, menu.menuLevel)
  }

  closeMoveDrawer()
}

// 递归更新子菜单层级
function updateChildrenLevel(parentId: number, parentLevel: number) {
  const children = domainMenus.value.filter(m => m.parentId === parentId)
  for (const child of children) {
    child.menuLevel = parentLevel + 1
    updateChildrenLevel(child.menuId, child.menuLevel)
  }
}

const isScrolling = ref(false)
let scrollTimer: ReturnType<typeof setTimeout> | null = null

function handleScroll() {
  isScrolling.value = true
  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }
  scrollTimer = setTimeout(() => {
    isScrolling.value = false
  }, 500)
}

onMounted(async () => {
  await fetchSystemMenus()
  if (isEdit.value) {
    const domainId = Number(route.params.id)
    await Promise.all([
      fetchDomain(domainId),
      fetchDomainMenus(domainId),
      fetchDataPermissions(domainId)
    ])
  }
})
</script>

<style scoped>
.domain-form {
  padding: 0 12px;
  height: 100%;
  overflow: hidden;
}

.page-card {
  width: 100%;
}

:deep(.ant-form-item) {
  display: flex;
  flex-direction: column;
  width: 100%;
}

:deep(.ant-form-item-label) {
  width: 80px;
  flex-shrink: 0;
}

:deep(.ant-form-item-label > label) {
  justify-content: flex-end;
}

:deep(.ant-card) {
  border: none;
  box-shadow: none;
}

:deep(.ant-card-body) {
  padding: 16px;
}

.menu-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.ant-drawer-body) {
  padding-top: 0;
  padding-bottom: 0;
}

.drawer-search {
  padding: 0 0 16px 0;
  border-bottom: 1px solid var(--color-border-secondary);
}

.drawer-tree {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  
  /* 默认不显示滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  
  &::-webkit-scrollbar {
    width: 6px;
    display: none; /* 隐藏滚动条 */
  }
  
  &:hover::-webkit-scrollbar {
    display: block; /* 鼠标悬停时显示滚动条 */
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
}

.drawer-footer {
  padding: 16px 0;
  border-top: 1px solid var(--color-border-secondary);
}

.menu-icon {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

:deep(.ant-table .ant-table-tbody .ant-table-row .ant-table-row-expand-icon),
:deep(.ant-table .ant-table-tbody .ant-table-row .ant-table-row-collapsed-icon) {
  color: var(--color-text-tertiary);

  &:hover {
    color: var(--primary-color);
  }

  &:active {
    color: var(--primary-color);
  }

  svg {
    color: inherit;
  }
}

:deep(.ant-table .ant-table-tbody .ant-table-row .ant-table-row-expand-icon-collapsed),
:deep(.ant-table .ant-table-tbody .ant-table-row .ant-table-row-expand-icon-expanded) {
  color: var(--color-text-tertiary);

  &:hover {
    color: var(--primary-color);
  }
}

:deep(.ant-table .ant-table-tbody .ant-table-row .ant-table-row-expand-icon-cell) {
  width: 0;
  padding: 0;
  visibility: hidden;
}

.permission-config {
  margin-bottom: 16px;
}

.domain-page-title {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-bg-page);

  :deep(.page-title) {
    padding: 0 4px;
  }
}

.domain-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 88px);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
}

.domain-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.domain-container::-webkit-scrollbar {
  width: 6px;
}

.domain-container::-webkit-scrollbar-track {
  background: transparent;
}

.domain-container::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
}

.domain-container:hover::-webkit-scrollbar-thumb,
.domain-container:active::-webkit-scrollbar-thumb,
.domain-container:focus::-webkit-scrollbar-thumb,
.domain-container.scrolling::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
}

.domain-container.scrolling {
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.domain-main-card {
  padding: 0;
  border-radius: 8px 8px 0 0;
}

.domain-section {
  padding: 0;
}

.domain-section:not(:last-child) {
  padding-bottom: 24px;
}

.menu-name-cell {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.menu-level-indicator {
  flex-shrink: 0;
  margin-right: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  white-space: nowrap;
}

.level-prefix {
  font-family: monospace;
}

.menu-name-input {
  box-sizing: border-box;
}

.move-drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.move-tip {
  margin-bottom: 16px;
  color: var(--color-text-secondary);
}

.move-radio-group {
  margin-bottom: 16px;
}

.move-tree-node {
  padding: 4px 0 4px 28px;
  margin-bottom: 8px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.85);
  transition: background-color 0.2s;
}

.move-tree-node:hover {
  background-color: #f5f5f5;
  border-radius: 2px;
}

.move-tree-node-selected {
  background-color: #FFF1E6;
  border-radius: 2px;
}

.move-tree-node-selected:hover {
  background-color: #FFF1E6;
}

.move-tree-node-label {
  display: inline-block;
}

:deep(.ant-tree-node-content-wrapper.ant-tree-node-selected) {
  border-radius: 2px;
}

:deep(.ant-tree-node-content-wrapper:hover) {
  border-radius: 2px;
}

.move-tree-container {
  flex: 1;
  overflow-y: auto;
}

.tree-node-disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

:deep(.domain-table-box .ant-table-cell-with-append) {
  display: flex;
  align-items: center;
}
:deep(.domain-table-box .ant-table-cell-with-append .menu-name-cell) {
  width: 100%;
}
</style>