<template>
  <ListPageTemplate
    v-model:filter-model-value="filterParams"
    :filter-items="(filterItems as any)"
    :columns="(columns as any)"
    :data-source="dataSource"
    :loading="loading"
    :title="pageTitle"
    @search="fetchData"
    @reset="handleReset"
  >
    <template #toolbar-actions>
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon><svg viewBox="0 0 48 48" style="width:16px;height:16px"><use href="#add" /></svg></template>
          新增导航
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'icon'">
        <svg viewBox="0 0 48 48" style="width:20px;height:20px">
          <use :href="`#${record.icon || 'app'}`" />
        </svg>
      </template>
      <template v-else-if="column.key === 'status'">
        <a-tag :color="record.status === 1 ? 'success' : 'default'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'action'">
        <a-space>
          <a @click="handleEdit(record)">编辑</a>
          <a-divider type="vertical" />
          <a-popconfirm title="确定删除？" @confirm="handleDelete(record)">
            <a class="danger">删除</a>
          </a-popconfirm>
        </a-space>
      </template>
    </template>
  </ListPageTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ListPageTemplate from '@/components/ListPageTemplate.vue'
import { API_ENDPOINTS } from '@/constants/api'

export interface JiuHaoHangRecord {
  id: number
  name: string
  path: string
  icon?: string
  sort: number
  status: number
}

const router = useRouter()
const loading = ref(false)
const dataSource = ref<JiuHaoHangRecord[]>([])
const filterParams = ref<Record<string, string>>({})

const pageTitle = '导航菜单'

// 筛选字段
const filterItems = [
  { key: 'name', label: '菜单名称', type: 'input', placeholder: '请输入菜单名称' },
  { key: 'path', label: '路径', type: 'input', placeholder: '请输入路径' },
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]},
]

// 表格列
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '图标', dataIndex: 'icon', key: 'icon', width: 80 },
  { title: '菜单名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '路径', dataIndex: 'path', key: 'path', width: 200 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await fetch(API_ENDPOINTS.NAV_MENUS)
    const json = await res.json()
    if (json.code === 200) {
      dataSource.value = json.data || []
    }
  } catch (e) {
    console.error('fetch nav-menus failed:', e)
  }
  loading.value = false
}

function handleReset() {
  filterParams.value = {}
  fetchData()
}

function handleAdd() {
  router.push('/dao-hang/create')
}

function handleEdit(record: JiuHaoHangRecord) {
  router.push(`/dao-hang/${record.id}`)
}

function handleDelete(record: JiuHaoHangRecord) {
  console.log('delete', record)
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.danger {
  color: var(--color-error);
}
</style>
