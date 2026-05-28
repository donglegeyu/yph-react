<template>
  <SmartListTemplate
    v-model:filter-model-value="filterParams"
    :fields="fields"
    :data-source="visibleDataSource"
    :loading="loading"
    :title="pageTitle"
    :pagination="false"
    :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    row-key="id"
    view-endpoint="/api/menu-views"
    view-type="menu"
    @search="fetchData"
    @reset="handleReset"
  >
    <template #toolbar-actions>
      <a-space :size="12">
        <a-button type="primary" @click="handleAdd">
          新增菜单
        </a-button>
        <a-button @click="handleBatchEnable" :disabled="!selectedRowKeys.length">
          批量启用
        </a-button>
        <a-button @click="handleBatchDisable" :disabled="!selectedRowKeys.length">
          批量禁用
        </a-button>
        <a-popconfirm
          title="确定删除选中的菜单？"
          @confirm="handleBatchDelete"
          :disabled="!selectedRowKeys.length"
        >
          <a-button type="default" danger :disabled="!selectedRowKeys.length">
            批量删除 ({{ selectedRowKeys.length }})
          </a-button>
        </a-popconfirm>
        <ColumnSettingsPanel
          :fields="columnFields"
          :default-fields="defaultColumnFields"
          :exclude-keys="[]"
          @confirm="handleColumnSettingsConfirm"
          @reset="handleColumnSettingsReset"
        >
          <a-button class="icon-only-btn" style="width: 32px; height: 32px; padding-left: 0px; padding-right: 0px;">
            <template #icon><svg viewBox="0 0 48 48" style="width:16px;height:16px"><use href="#setting" /></svg></template>
          </a-button>
        </ColumnSettingsPanel>
        <a-button class="icon-only-btn" @click="fetchData" style="width: 32px; height: 32px;">
          <template #icon><svg viewBox="0 0 48 48" style="width:16px;height:16px"><use href="#refresh" /></svg></template>
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'label'">
        <span :style="{ display: 'inline-flex', alignItems: 'center', paddingLeft: (record.level || 0) * 16 + 'px' }">
          <span
            v-if="record.hasChildren"
            @click="toggleExpand(record)"
            style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1px solid #d9d9d9;border-radius:4px;font-size:12px;color:#595959;font-style:normal;box-sizing:border-box;flex-shrink:0;margin-right:6px;"
          >
            {{ isExpanded(record) ? '−' : '+' }}
          </span>
          <span v-else style="display:inline-block;width:16px;height:16px;flex-shrink:0;margin-right:6px;"></span>
          <span style="white-space: nowrap;">
            {{ record.label }}
          </span>
        </span>
      </template>
      <template v-else-if="column.key === 'level'">
        {{ record.levelText }}
      </template>
      <template v-else-if="column.key === 'menuType'">
        <span>{{ record.menuType }}</span>
      </template>
      <template v-else-if="column.key === 'icon'">
        <span v-if="record.icon && record.level !== 2" class="icon-cell">
          <svg viewBox="0 0 48 48" style="width:16px;height:16px">
            <use :href="`#${record.icon}`" />
          </svg>
        </span>
        <span v-else>-</span>
      </template>
      <template v-else-if="column.key === 'path'">
        <span>{{ record.path || '-' }}</span>
      </template>
      <template v-else-if="column.key === 'status'">
        <a-tag :color="record.status === 1 ? 'success' : 'default'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'action'">
        <ActionCell :buttons="getActionButtons(record)" />
      </template>
    </template>
    <template #headerCell="{ column }">
      <template v-if="column.key === 'label'">
        <span style="display:inline-flex;align-items:center;">
          <span
            @click="toggleAllExpand"
            style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1px solid #d9d9d9;border-radius:4px;font-size:12px;color:#595959;font-style:normal;box-sizing:border-box;flex-shrink:0;margin-right:6px;"
            :title="allExpanded ? '收起全部' : '展开全部'"
          >
            {{ allExpanded ? '−' : '+' }}
          </span>
          <span>{{ column.title }}</span>
        </span>
      </template>
      <template v-else>
        {{ column.title }}
      </template>
    </template>
  </SmartListTemplate>

  <!-- 新增/编辑抽屉 -->
  <a-drawer
    v-model:open="modalVisible"
    :title="modalTitle"
    width="360"
    @close="handleModalCancel"
  >
    <a-form :model="formData" layout="vertical" ref="formRef">
      <a-form-item label="菜单Key" name="key">
        <a-input v-model:value="formData.key" placeholder="如: material-center" />
      </a-form-item>
      <a-form-item label="菜单名称" name="label">
        <a-input v-model:value="formData.label" placeholder="如: 材料中心" />
      </a-form-item>
      <a-form-item label="路径" name="path">
        <a-input v-model:value="formData.path" placeholder="如: /materials" />
      </a-form-item>
      <a-form-item label="上级菜单" name="parentId">
        <a-tree-select
          v-model:value="formData.parentId"
          :tree-data="parentTreeData"
          tree-node-label-prop="title"
          :dropdown-match-select-width="false"
          placeholder="选择上级菜单（留空为一级菜单）"
          allow-clear
          show-search
          :search-value="parentSearchValue"
          tree-default-expand-all
          :filter-tree-node="(input, node) => (node.title as string)?.toLowerCase().includes(input.toLowerCase())"
          @search="val => parentSearchValue = val"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="图标" name="icon">
        <IconSelect v-model:value="formData.icon" placeholder="请选择图标" />
      </a-form-item>
      <a-form-item label="菜单类型" name="menuType">
        <a-select v-model:value="formData.menuType" :options="menuTypeOptions" placeholder="请选择菜单类型" />
      </a-form-item>
      <a-form-item label="排序" name="sort">
        <a-input-number v-model:value="formData.sort" :min="0" style="width: 100%" />
      </a-form-item>
      <a-form-item label="状态" name="status">
        <a-radio-group v-model:value="formData.status">
          <a-radio :value="1">启用</a-radio>
          <a-radio :value="0">禁用</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
    <template #footer>
      <a-space>
        <a-button @click="handleModalCancel">取消</a-button>
        <a-button type="primary" @click="handleModalOk">确定</a-button>
      </a-space>
    </template>
  </a-drawer>

  <!-- 移动菜单抽屉 -->
  <a-drawer
    v-model:open="moveDrawerVisible"
    title="移动菜单"
    width="420"
    @close="closeMoveDrawer"
  >
    <div v-if="moveTargetRecord" class="move-drawer-content">
      <div class="move-tip">
        将「{{ moveTargetRecord.label }}」移动至：
      </div>
      <div class="move-tree-container">
        <a-tree
          v-if="moveTreeData.length"
          :tree-data="moveTreeData"
          :expanded-keys="moveExpandedKeys"
          :selected-keys="selectedMoveTargetId !== null ? [String(selectedMoveTargetId)] : []"
          :block-node="true"
          :selectable="true"
          :show-icon="false"
          @select="onMoveTreeSelect"
          @expand="onMoveTreeExpand"
        >
          <template #title="{ dataRef }">
            <span :class="{ 'tree-node-disabled': dataRef.disabled }">
              {{ dataRef.label }}
              <span v-if="dataRef.disabled" style="color: #999; font-size: 12px;">（超出层级）</span>
            </span>
          </template>
        </a-tree>
        <a-empty v-else description="暂无数据" />
      </div>

    </div>
    <template #footer>
      <a-space>
        <a-button @click="closeMoveDrawer">取消</a-button>
        <a-button type="primary" @click="confirmMove" :disabled="selectedMoveTargetId === null">确认移动</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import SmartListTemplate from '@/components/SmartListTemplate.vue'
import ActionCell from '@/components/ActionCell.vue'
import IconSelect from '@/components/IconSelect.vue'
import ColumnSettingsPanel from '@/components/ColumnSettingsPanel.vue'
import { useAppStore } from '@/stores/app'
import { API_ENDPOINTS } from '@/constants/api'

/**
 * 菜单树节点
 */
export interface MenuTreeItem {
  id: number
  key: string
  label: string
  path?: string
  icon?: string
  status: number
  parentId: number
  sort?: number
  menuType?: string
  children?: MenuTreeItem[]
}

/**
 * 扁平化的菜单项（用于表格展示）
 */
export interface FlatMenuItem extends Omit<MenuTreeItem, 'children'> {
  level: number
  hasChildren: boolean
  show: boolean
  menuType: string
  levelText: string
}

/**
 * 移动目标树节点
 */
export interface MoveTreeNode {
  key: string
  label: string
  disabled: boolean
  children?: MoveTreeNode[]
}

/**
 * 菜单筛选参数
 */
export interface MenuFilterParams {
  label?: string
  level?: number | string
  menuType?: string
  status?: number | string
  path?: string
  key?: string
  sort?: number | string
  [key: string]: string | number | undefined
}

/**
 * 表单数据
 */
export interface MenuFormData {
  id: number | null
  key: string
  label: string
  path: string
  icon: string
  sort: number
  status: number
  parentId: number
  menuType: string
}

const loading = ref(false)
const dataSource = ref<FlatMenuItem[]>([])
const appStore = useAppStore()
const filterParams = ref<MenuFilterParams>({})
const expandedKeys = ref<string[]>([])
const selectedRowKeys = ref<(string | number)[]>([])

// 原始菜单数据（树形结构）
const rawMenuData = ref<MenuTreeItem[]>([])

// 移动抽屉相关
const moveDrawerVisible = ref(false)
const moveTargetRecord = ref<FlatMenuItem | null>(null)
const selectedMoveTargetId = ref<number | null>(null)
const moveExpandedKeys = ref<string[]>([])
const moveTreeData = ref<MoveTreeNode[]>([])

// 行选择
function onSelectChange(keys: (string | number)[]) {
  selectedRowKeys.value = keys
}

// 移动树选择
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



// 构建移动目标树数据
function buildMoveTreeData(record: FlatMenuItem): MoveTreeNode[] {
  const maxSubLevel = getMaxSubLevel(record)

  // 获取当前菜单及其所有子菜单的 ID 列表（使用字符串比较避免类型问题）
  const getDescendantIds = (node: MenuTreeItem): string[] => {
    const ids: string[] = [String(node.id)]
    if (node.children?.length) {
      for (const child of node.children) {
        ids.push(...getDescendantIds(child))
      }
    }
    return ids
  }

  // 找到当前菜单在 rawMenuData 中的对应节点
  const findRecordNode = (items: MenuTreeItem[]): MenuTreeItem | null => {
    const targetId = record.id
    const targetIdStr = String(record.id)
    for (const item of items) {
      if (item.id === targetId || item.id === targetIdStr || String(item.id) === targetIdStr) {
        return item
      }
      if (item.children?.length) {
        const found = findRecordNode(item.children)
        if (found) return found
      }
    }
    return null
  }

  // 构建菜单ID到实际层级的映射（使用字符串作为 key）
  const buildLevelMap = (items: MenuTreeItem[], currentLevel = 0, map: Map<string, number> = new Map()): Map<string, number> => {
    for (const item of items) {
      map.set(String(item.id), currentLevel)
      if (item.children?.length) {
        buildLevelMap(item.children, currentLevel + 1, map)
      }
    }
    return map
  }

  const recordNode = findRecordNode(rawMenuData.value)
  const excludedIds = recordNode ? getDescendantIds(recordNode) : [String(record.id)]
  const levelMap = buildLevelMap(rawMenuData.value, 0, new Map())

  const traverse = (items: MenuTreeItem[]): MoveTreeNode[] => {
    const nodes: MoveTreeNode[] = []
    
    for (const item of items) {
      const itemIdStr = String(item.id)
      // 只排除当前菜单及其子菜单
      if (excludedIds.includes(itemIdStr)) {
        continue
      }

      const isBizMenu = !item.menuType || item.menuType === '业务菜单'
      
      // 只处理业务菜单
      if (!isBizMenu) {
        continue
      }

      // 递归处理子菜单（只保留业务子菜单）
      const childrenNodes = item.children?.length ? traverse(item.children) : undefined

      // 获取目标菜单的实际层级
      const targetMenuLevel = levelMap.get(itemIdStr) ?? 0
      // 移动后的层级 = 目标菜单层级 + 1
      const newLevelAfterMove = targetMenuLevel + 1
      // 判断是否超出限制
      const wouldExceed = newLevelAfterMove + maxSubLevel > 2
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

  const treeData = traverse(rawMenuData.value)

  return treeData
}

function getAncestorIds(item: FlatMenuItem): number[] {
  const findInTree = (
    nodes: MenuTreeItem[],
    targetId: number,
    path: MenuTreeItem[] = []
  ): MenuTreeItem[] | null => {
    for (const node of nodes) {
      if (node.id === targetId) return [...path, node]
      if (node.children?.length) {
        const result = findInTree(node.children, targetId, [...path, node])
        if (result) return result
      }
    }
    return null
  }
  const ancestors = findInTree(rawMenuData.value, item.id) || []
  return ancestors.map((a) => a.id)
}

// 仅显示标记为 show: true 的行
const visibleDataSource = computed(() => dataSource.value.filter(item => item.show !== false))

const pageTitle = '菜单管理'

// 统一字段定义（三端同步）
const fields = [
  { key: 'label', label: '菜单名称', type: 'input' as const, width: 280, fixed: 'left' as const },
  { key: 'level', label: '菜单层级', type: 'select' as const, options: [
    { label: '一级', value: 0 },
    { label: '二级', value: 1 },
    { label: '三级', value: 2 },
  ], width: 100 },
  { key: 'menuType', label: '菜单类型', type: 'select' as const, options: [
    { label: '业务菜单', value: '业务菜单' },
    { label: '系统菜单-上', value: '系统菜单-上' },
    { label: '系统菜单-下', value: '系统菜单-下' },
  ], width: 120 },
  { key: 'status', label: '状态', type: 'select' as const, options: [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ], width: 80 },
  { key: 'icon', label: '图标', type: 'input' as const, width: 80 },
  { key: 'path', label: '路径', type: 'input' as const, width: 150 },
  { key: 'key', label: 'Key', type: 'input' as const, width: 150 },
  { key: 'sort', label: '排序', type: 'input' as const, width: 80 },
  { key: 'action', label: '操作', width: 168 },
]

// 列设置相关
interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right'
}

const defaultColumnFields: ColumnField[] = fields
  .filter(field => field.key !== 'action') // 过滤掉操作字段
  .map(field => ({
    key: field.key,
    label: field.label,
    visible: true,
    width: field.width,
    fixed: field.fixed,
  }))

const columnFields = ref<ColumnField[]>([])

function initColumnFields() {
  columnFields.value = JSON.parse(JSON.stringify(defaultColumnFields))
}

function loadColumnSettings() {
  try {
    const saved = localStorage.getItem('menu-management-column-settings')
    if (saved) {
      const savedFields = JSON.parse(saved)
      if (Array.isArray(savedFields) && savedFields.length > 0) {
        columnFields.value = savedFields
        return
      }
    }
  } catch (e) {
    console.error('加载列设置失败', e)
  }
  initColumnFields()
}

function saveColumnSettings() {
  try {
    localStorage.setItem('menu-management-column-settings', JSON.stringify(columnFields.value))
  } catch (e) {
    console.error('保存列设置失败', e)
  }
}

function handleColumnSettingsConfirm(fields: ColumnField[]) {
  columnFields.value = fields
  saveColumnSettings()
}

function handleColumnSettingsReset() {
  columnFields.value = JSON.parse(JSON.stringify(defaultColumnFields))
  saveColumnSettings()
}

// 全局展开/收起状态
const allExpanded = ref(false)

// 菜单类型映射
function getMenuType(key: string): string {
  if (key === 'home') {
    return '系统菜单-上'
  }
  if (key === 'favorites' || key === 'super-search') {
    return '系统菜单-下'
  }
  return '业务菜单'
}

// 系统菜单-上不允许删除
function canDelete(record: FlatMenuItem): boolean {
  return record.menuType !== '系统菜单-上'
}

// 菜单层级文字
function getLevelText(level: number): string {
  const map: Record<number, string> = { 0: '一级', 1: '二级', 2: '三级' }
  return map[level] || '三级'
}

// 全局展开/收起
function toggleAllExpand() {
  allExpanded.value = !allExpanded.value
  if (allExpanded.value) {
    expandedKeys.value = rawMenuData.value.map((item) => item.key)
  } else {
    expandedKeys.value = []
  }
  const filtered = filterTree(rawMenuData.value, filterParams.value)
  dataSource.value = flattenTree(filtered)
}

// 弹窗相关
const modalVisible = ref(false)
const modalTitle = ref('')
const formData = ref({
  id: null as number | null,
  key: '',
  label: '',
  path: '',
  icon: '',
  sort: 0,
  status: 1,
  parentId: null as string | null,
  menuType: '业务菜单',
})

const parentSearchValue = ref('')

function buildMenuTree(items: MenuTreeItem[], excludeId?: number): any[] {
  const result: any[] = []
  for (const item of items) {
    if (excludeId && item.id === excludeId) continue
    const children = buildMenuTree(item.children || [], excludeId)
    result.push({
      value: String(item.id),
      title: item.label,
      children: children.length > 0 ? children : undefined
    })
  }
  return result
}

function findMenuById(items: MenuTreeItem[], id: number): MenuTreeItem | null {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children) {
      const found = findMenuById(item.children, id)
      if (found) return found
    }
  }
  return null
}

const parentTreeData = computed(() => {
  const search = parentSearchValue.value.trim().toLowerCase()
  const excludeId = formData.value.id || undefined

  if (search) {
    const results: any[] = []
    const collect = (items: MenuTreeItem[]) => {
      for (const item of items) {
        if (excludeId && item.id === excludeId) continue
        if (item.label.toLowerCase().includes(search)) {
          results.push({ value: String(item.id), title: item.label })
        }
        if (item.children) collect(item.children)
      }
    }
    collect(rawMenuData.value)
    return results
  }

  return buildMenuTree(rawMenuData.value, excludeId)
})

const menuTypeOptions = [
  { label: '业务菜单', value: '业务菜单' },
  { label: '系统菜单-上', value: '系统菜单-上' },
  { label: '系统菜单-下', value: '系统菜单-下' },
]

// 扁平化树数据
function flattenTree(
  data: MenuTreeItem[],
  result: FlatMenuItem[] = [],
  level = 0,
  parentExpanded = true
): FlatMenuItem[] {
  for (const item of data) {
    const { children, ...rest } = item
    const hasChildren = !!(children && children.length)
    const shouldShow = parentExpanded
    const itemLevel = level
    result.push({
      ...rest,
      level: itemLevel,
      hasChildren,
      show: shouldShow,
      menuType: rest.menuType || getMenuType(rest.key),
      levelText: getLevelText(itemLevel),
    })
    if (children?.length) {
      flattenTree(children, result, itemLevel + 1, shouldShow && expandedKeys.value.includes(item.key))
    }
  }
  return result
}

// 根据筛选条件过滤（前端简单过滤）- 方式一：只显示匹配节点，不显示父节点
function filterTree(data: MenuTreeItem[], params: MenuFilterParams): MenuTreeItem[] {
  const hasFilters = Object.values(params).some(v => v !== undefined && v !== null && v !== '')

  if (!hasFilters) {
    return data
  }

  const result: MenuTreeItem[] = []

  for (const item of data) {
    const labelMatch = !params.label || item.label?.includes(params.label)
    const menuTypeMatch = !params.menuType || item.menuType === params.menuType
    const statusMatch = params.status === undefined || params.status === null || params.status === '' || item.status === params.status
    const pathMatch = !params.path || item.path?.includes(params.path)
    const keyMatch = !params.key || item.key?.includes(params.key)
    const sortMatch = !params.sort || params.sort === '' || Number(item.sort) === Number(params.sort)

    if (labelMatch && menuTypeMatch && statusMatch && pathMatch && keyMatch && sortMatch) {
      result.push({ ...item, children: undefined })
    } else if (item.children?.length) {
      const childResults = filterTree(item.children, params)
      result.push(...childResults)
    }
  }

  return result
}

async function fetchData() {
  loading.value = true
  try {
    const res = await fetch(API_ENDPOINTS.NAV_MENUS)
    const json = await res.json()
    if (json.code === 200) {
      rawMenuData.value = json.data || []
      const filtered = filterTree(json.data || [], filterParams.value)
      dataSource.value = flattenTree(filtered)
    } else {
      message.error('菜单数据加载失败，请稍后重试')
    }
  } catch (e) {
    console.error('fetch nav-menus failed:', e)
    message.error('菜单数据加载失败，请稍后重试')
  }
  loading.value = false
}

function handleReset() {
  filterParams.value = {}
  fetchData()
}

function handleAdd() {
  modalTitle.value = '新增菜单'
  formData.value = { id: null, key: '', label: '', path: '', icon: '', sort: 0, status: 1, parentId: null, menuType: '业务菜单' }
  modalVisible.value = true
}

function handleAddChild(record: FlatMenuItem) {
  modalTitle.value = '新增下级菜单'
  formData.value = { id: null, key: '', label: '', path: '', icon: '', sort: 0, status: 1, parentId: record.id, menuType: '业务菜单' }
  modalVisible.value = true
}

function getActionButtons(record: FlatMenuItem | Record<string, any>) {
  const buttons = []
  const flatRecord = record as FlatMenuItem

  // 编辑
  buttons.push({ key: 'edit', label: '编辑', onClick: () => handleEdit(flatRecord) })

  // 启用/禁用
  if (flatRecord.status === 1) {
    buttons.push({ key: 'disable', label: '禁用', onClick: () => handleToggleStatus(flatRecord, 0) })
  } else {
    buttons.push({ key: 'enable', label: '启用', onClick: () => handleToggleStatus(flatRecord, 1) })
  }

  // 新增下级
  if (flatRecord.level < 2) {
    buttons.push({ key: 'addChild', label: '新增下级', onClick: () => handleAddChild(flatRecord) })
  }

  // 移动
  buttons.push({ key: 'move', label: '移动', onClick: () => openMoveDrawer(flatRecord) })

  // 删除
  if (canDelete(flatRecord)) {
    buttons.push({ key: 'delete', label: '删除', danger: true, confirm: true, confirmTitle: '确定删除？', onClick: () => handleDelete(flatRecord) })
  }

  return buttons
}

// 切换状态
async function handleToggleStatus(record: FlatMenuItem, status: number) {
  try {
    const res = await fetch(`${API_ENDPOINTS.NAV_MENUS}/${record.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...record, status }),
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success(status === 1 ? '已启用' : '已禁用')
      fetchData()
      appStore.fetchMenus(true)
    } else {
      message.error(json.message || '操作失败')
    }
  } catch (e) {
    message.error('操作失败')
  }
}

function handleEdit(record: FlatMenuItem) {
  modalTitle.value = '编辑菜单'
  const pid = record.parentId ? String(record.parentId) : null
  console.log('[handleEdit] record.parentId:', record.parentId, '-> pid:', pid)
  console.log('[handleEdit] parentTreeData has id:', parentTreeData.value.some(n => n.value === pid))
  formData.value = {
    id: record.id,
    key: record.key,
    label: record.label,
    path: record.path || '',
    icon: record.icon || '',
    sort: record.sort || 0,
    status: record.status,
    parentId: pid,
    menuType: record.menuType
  }
  modalVisible.value = true
}

async function handleModalOk() {
  try {
    const method = formData.value.id ? 'PUT' : 'POST'
    const url = formData.value.id ? `${API_ENDPOINTS.NAV_MENUS}/${formData.value.id}` : API_ENDPOINTS.NAV_MENUS
    const submitData = {
      ...formData.value,
      parentId: formData.value.parentId ? Number(formData.value.parentId) : null
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success(formData.value.id ? '更新成功' : '新增成功')
      modalVisible.value = false
      await fetchData()
      // 刷新全局菜单缓存
      await appStore.fetchMenus(true)
      const updatedRecord = dataSource.value.find((d) => d.id === formData.value.id)
      console.log('[handleModalOk] 刷新后的记录:', updatedRecord ? JSON.stringify(updatedRecord) : '未找到')
    } else {
      message.error(json.message || '操作失败')
    }
  } catch (e) {
    message.error('操作失败')
  }
}

function handleModalCancel() {
  modalVisible.value = false
}

async function handleDelete(record: FlatMenuItem) {
  if (!record.id) return
  try {
    const res = await fetch(`${API_ENDPOINTS.NAV_MENUS}/${record.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.code === 200) {
      message.success('删除成功')
      fetchData()
      // 刷新全局菜单缓存
      appStore.fetchMenus(true)
    } else {
      message.error(json.message || '删除失败')
    }
  } catch (e) {
    message.error('删除失败')
  }
}

function toggleExpand(record: FlatMenuItem | Record<string, any>) {
  const key = record.key as string
  if (expandedKeys.value.includes(key)) {
    expandedKeys.value = expandedKeys.value.filter(k => k !== key)
  } else {
    expandedKeys.value.push(key)
  }
  // 重新生成 dataSource 以更新 show 状态
  const filtered = filterTree(rawMenuData.value, filterParams.value)
  dataSource.value = flattenTree(filtered)
}

function isExpanded(record: FlatMenuItem | Record<string, any>) {
  return expandedKeys.value.includes(record.key as string)
}

// 批量启用
async function handleBatchEnable() {
  if (!selectedRowKeys.value.length) return
  try {
    const res = await fetch(API_ENDPOINTS.NAV_MENUS_BATCH_STATUS, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedRowKeys.value, status: 1 }),
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success(`已启用 ${selectedRowKeys.value.length} 个菜单`)
      selectedRowKeys.value = []
      fetchData()
      appStore.fetchMenus(true)
    } else {
      message.error(json.message || '操作失败')
    }
  } catch (e) {
    message.error('操作失败')
  }
}

// 批量禁用
async function handleBatchDisable() {
  if (!selectedRowKeys.value.length) return
  try {
    const res = await fetch(API_ENDPOINTS.NAV_MENUS_BATCH_STATUS, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedRowKeys.value, status: 0 }),
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success(`已禁用 ${selectedRowKeys.value.length} 个菜单`)
      selectedRowKeys.value = []
      fetchData()
      appStore.fetchMenus(true)
    } else {
      message.error(json.message || '操作失败')
    }
  } catch (e) {
    message.error('操作失败')
  }
}

// 批量删除
async function handleBatchDelete() {
  if (!selectedRowKeys.value.length) return
  try {
    const res = await fetch(API_ENDPOINTS.NAV_MENUS_BATCH, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedRowKeys.value }),
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success(`已删除 ${selectedRowKeys.value.length} 个菜单`)
      selectedRowKeys.value = []
      fetchData()
      appStore.fetchMenus(true)
    } else {
      message.error(json.message || '删除失败')
    }
  } catch (e) {
    message.error('删除失败')
  }
}

// 获取菜单及其所有子菜单的最大层级深度
function getMaxSubLevel(record: FlatMenuItem): number {
  const findInTree = (items: MenuTreeItem[], depth = 0): number => {
    for (const item of items) {
      if (item.id === record.id) {
        const subDepth = getSubTreeDepth(item)
        return subDepth
      }
      if (item.children?.length) {
        const d = findInTree(item.children, depth + 1)
        if (d > 0) return d
      }
    }
    return 0
  }
  return findInTree(rawMenuData.value)
}

function getSubTreeDepth(node: MenuTreeItem): number {
  if (!node.children?.length) return 0
  let maxChildDepth = 0
  for (const child of node.children) {
    maxChildDepth = Math.max(maxChildDepth, getSubTreeDepth(child))
  }
  return 1 + maxChildDepth
}

// 打开移动抽屉
function openMoveDrawer(record: FlatMenuItem) {
  moveTargetRecord.value = record
  selectedMoveTargetId.value = null
  moveTreeData.value = buildMoveTreeData(record)
  moveExpandedKeys.value = rawMenuData.value.map((item) => String(item.id))
  moveDrawerVisible.value = true
}

// 关闭移动抽屉
function closeMoveDrawer() {
  moveDrawerVisible.value = false
  moveTargetRecord.value = null
  selectedMoveTargetId.value = null
  moveTreeData.value = []
  moveExpandedKeys.value = []
}

// 确认移动
async function confirmMove() {
  if (!moveTargetRecord.value || selectedMoveTargetId.value === null) return

  const record = moveTargetRecord.value
  const newParentId = selectedMoveTargetId.value

  if (record.parentId === newParentId) {
    message.info('菜单已在目标位置')
    return
  }

  try {
    const res = await fetch(`${API_ENDPOINTS.NAV_MENUS}/${record.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...record, parentId: newParentId }),
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success('移动成功')
      closeMoveDrawer()
      fetchData()
    } else {
      message.error(json.message || '移动失败')
    }
  } catch (e) {
    message.error('移动失败')
  }
}

onMounted(async () => {
  // 加载列设置
  loadColumnSettings()
  // 获取数据
  fetchData()
})
</script>

<style>
.icon-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.danger {
  color: var(--color-error);
}

.icon-only-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  &:active {
    outline: none !important;
    box-shadow: none !important;
  }
}

.icon-only-btn :deep(.anticon) {
  margin: 0;
}

.icon-only-btn :deep(svg) {
  width: 16px !important;
  height: 16px !important;
}

.action-more-btn {
  padding: 0 4px;
  height: 24px;
}

:deep(.ant-dropdown-menu) {
  min-width: 160px;
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

.move-tree-container {
  flex: 1;
  overflow-y: auto;
}

.move-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-secondary);
}

.tree-node-disabled {
  color: var(--color-text-disabled-light, #999);
  cursor: not-allowed;
}

:deep(.ant-table-row-selected) {
  background-color: transparent !important;
}

:deep(.ant-table-row-selected:hover) {
  background-color: transparent !important;
}

:deep(.ant-table-cell-fix-left-last::after),
:deep(.ant-table-cell-fix-right-first::after) {
  border-right: none !important;
}

:deep(.ant-table-cell-fix-left::after),
:deep(.ant-table-cell-fix-right::after) {
  border-right: none !important;
}

:deep(.ant-table-wrapper .ant-table-thead > tr > th:not(:last-child):not(.ant-table-selection-column):not(.ant-table-row-expand-icon-cell):not([colspan])::before),
:deep(.ant-table-wrapper .ant-table-thead > tr > td:not(:last-child):not(.ant-table-selection-column):not(.ant-table-row-expand-icon-cell):not([colspan])::before) {
  display: none !important;
}

:deep(.ant-table-thead > tr > th) {
  vertical-align: middle;
}

:deep(.ant-table-thead > tr > th),
:deep(.ant-table-tbody > tr > td) {
  padding: 8px 8px;
}

:deep(.ant-table-thead > tr > th:first-child) {
  text-align: center;
}

:deep(.ant-table-cell[data-column-key="icon"]),
:deep(.ant-table-thead > tr > th[data-column-key="icon"]) {
  text-align: left !important;
}

:deep(td.ant-table-cell[data-column-key="icon"]),
:deep(th.ant-table-cell[data-column-key="icon"]) {
  text-align: left !important;
}

:deep(.ant-table-wrapper .ant-table-tbody td.ant-table-cell[data-column-key="icon"]) .icon-cell {
  justify-content: flex-start !important;
  display: flex !important;
  float: left !important;
}



:deep(.ant-checkbox-wrapper) {
  border-radius: 2px;
}

:deep(.ant-checkbox) {
  border-radius: 2px;
}
</style>
