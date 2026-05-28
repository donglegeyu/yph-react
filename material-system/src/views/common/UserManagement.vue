<template>
  <SmartListTemplate
    v-model:filter-model-value="filterParams"
    :fields="fields"
    :data-source="dataSource"
    :loading="loading"
    :title="pageTitle"
    :pagination="pagination"
    view-endpoint="/api/views"
    view-type="user-management"
    @search="handleSearch"
    @reset="handleReset"
  >
    <template #toolbar-actions>
      <a-space :size="12">
        <a-button type="primary" @click="handleAdd">
          新增用户
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <a-tag :color="record.status === 1 ? 'success' : 'default'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'action'">
        <ActionCell :buttons="getActionButtons(record)" />
      </template>
    </template>
  </SmartListTemplate>

  <a-drawer
    v-model:open="drawerVisible"
    :title="drawerTitle"
    width="400"
    @close="handleDrawerClose"
  >
    <a-form :model="formData" layout="vertical" ref="formRef">
      <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
        <a-input v-model:value="formData.username" placeholder="请输入用户名" />
      </a-form-item>
      <a-form-item :label="isEdit ? '密码（留空不修改）' : '密码'" :name="isEdit ? 'password-optional' : 'password'" :rules="isEdit ? [] : [{ required: true, message: '请输入密码' }]">
        <a-input-password v-model:value="formData.password" :placeholder="isEdit ? '留空则不修改密码' : '请输入密码'" />
      </a-form-item>
      <a-form-item label="昵称" name="nickname">
        <a-input v-model:value="formData.nickname" placeholder="请输入昵称" />
      </a-form-item>
      <a-form-item label="状态" name="status">
        <a-radio-group v-model:value="formData.status">
          <a-radio :value="1">启用</a-radio>
          <a-radio :value="0">禁用</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="所属域" name="domainIds">
        <a-select v-model:value="formData.domainIds" mode="multiple" placeholder="请选择所属域">
          <a-select-option v-for="domain in allDomains" :key="domain.id" :value="domain.id">
            {{ domain.domainName }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
    <template #footer>
      <a-space>
        <a-button @click="handleDrawerClose">取消</a-button>
        <a-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import SmartListTemplate from '@/components/SmartListTemplate.vue'
import ActionCell from '@/components/ActionCell.vue'
import { useSysUsers, useDomains, type Domain } from '@/composables'

const {
  loading,
  dataSource,
  pagination,
  filterParams,
  fetchData,
  refresh,
  updateUserStatus,
  createUser,
  updateUser,
  assignDomains,
  fetchUserDomains,
} = useSysUsers()

const { fetchAllDomains } = useDomains()

const submitLoading = ref(false)
const drawerVisible = ref(false)
const drawerTitle = ref('新增用户')
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const allDomains = ref<Domain[]>([])

const formData = reactive({
  username: '',
  password: '',
  nickname: '',
  status: 1,
  domainIds: [] as number[]
})

const fields = [
  { key: 'username', label: '用户名', type: 'input' as const, width: 150 },
  { key: 'nickname', label: '昵称', type: 'input' as const, width: 150 },
  { key: 'status', label: '状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 }
  ], width: 100 },
  { key: 'action', label: '操作', width: 150 }
]

const pageTitle = '用户管理'

async function loadDomains() {
  allDomains.value = await fetchAllDomains()
}

function handleSearch() {
  fetchData(filterParams.value)
}

function handleReset() {
  Object.assign(filterParams.value, { username: '', status: '' })
  pagination.value.current = 1
  fetchData(filterParams.value)
}

function handleAdd() {
  drawerTitle.value = '新增用户'
  isEdit.value = false
  editingId.value = null
  Object.assign(formData, { username: '', password: '', nickname: '', status: 1, domainIds: [] })
  drawerVisible.value = true
}

async function handleEdit(record: any) {
  drawerTitle.value = '编辑用户'
  isEdit.value = true
  editingId.value = record.id
  Object.assign(formData, {
    username: record.username,
    password: '',
    nickname: record.nickname,
    status: record.status,
    domainIds: []
  })
  formData.domainIds = (await fetchUserDomains(record.id)).map(d => d.id)
  drawerVisible.value = true
}

function handleDrawerClose() {
  drawerVisible.value = false
}

async function handleSubmit() {
  submitLoading.value = true
  try {
    const payload: any = {
      username: formData.username,
      nickname: formData.nickname,
      status: formData.status
    }
    if (formData.password) {
      payload.password = formData.password
    }

    let success = false
    if (isEdit.value && editingId.value) {
      success = await updateUser(editingId.value, payload)
      if (success) {
        await assignDomains(editingId.value, formData.domainIds)
      }
    } else {
      const newId = await createUser(payload)
      if (newId) {
        await assignDomains(newId, formData.domainIds)
        success = true
      }
    }

    if (success) {
      message.success(isEdit.value ? '更新成功' : '创建成功')
      drawerVisible.value = false
      refresh()
    }
  } catch {
    message.error('操作失败')
  }
  submitLoading.value = false
}

function getActionButtons(record: any) {
  return [
    { key: 'edit', label: '编辑', onClick: () => handleEdit(record) },
    { key: 'toggle', label: record.status === 1 ? '禁用' : '启用', onClick: () => handleToggleStatus(record) }
  ]
}

async function handleToggleStatus(record: any) {
  const success = await updateUserStatus(record.id, record.status === 1 ? 0 : 1)
  if (success) {
    message.success(record.status === 1 ? '已禁用' : '已启用')
    refresh()
  }
}

onMounted(() => {
  fetchData()
  loadDomains()
})
</script>
