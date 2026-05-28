<template>
  <div class="permission-query">
    <a-card>
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="byUser" tab="按人查询" />
        <a-tab-pane key="byDomain" tab="按域查询" />
      </a-tabs>

      <div v-if="activeTab === 'byUser'" class="query-section">
        <div class="query-header">
          <a-select
            v-model:value="selectedUserId"
            show-search
            placeholder="请选择用户"
            style="width: 300px"
            :filter-option="filterUserOption"
            @change="(val) => handleUserChange(val as number)"
          >
            <a-select-option v-for="user in userList" :key="user.id" :value="user.id">
              {{ user.nickname || user.username }} ({{ user.username }})
            </a-select-option>
          </a-select>
        </div>

        <div v-if="selectedUserId" class="result-section">
          <a-divider>所属域</a-divider>
          <div class="domain-list">
            <a-tag v-for="domain in userDomains" :key="domain.id" color="blue" size="large">
              {{ domain.domainName }}
            </a-tag>
            <span v-if="userDomains.length === 0" class="empty-text">暂无分配域</span>
          </div>

          <a-divider>菜单权限</a-divider>
          <div class="menu-tree">
            <a-tree
              v-if="menuTree.length > 0"
              :tree-data="menuTree"
              :selectedKeys="selectedMenuKeys"
              checkable
              disabled
            />
            <span v-else class="empty-text">暂无菜单权限</span>
          </div>
        </div>
      </div>

      <div v-else class="query-section">
        <div class="query-header">
          <a-select
            v-model:value="selectedDomainId"
            placeholder="请选择域"
            style="width: 300px"
            @change="(val) => handleDomainChange(val as number)"
          >
            <a-select-option v-for="domain in domainList" :key="domain.id" :value="domain.id">
              {{ domain.domainName }} ({{ domain.isDefault === 1 ? '默认域' : '自定义域' }})
            </a-select-option>
          </a-select>
        </div>

        <div v-if="selectedDomainId" class="result-section">
          <a-divider>域信息</a-divider>
          <a-descriptions :column="2">
            <a-descriptions-item label="域标识">{{ selectedDomain?.domainKey }}</a-descriptions-item>
            <a-descriptions-item label="域名称">{{ selectedDomain?.domainName }}</a-descriptions-item>
            <a-descriptions-item label="域类型">
              <a-tag :color="selectedDomain?.isDefault === 1 ? 'gold' : 'default'">
                {{ selectedDomain?.isDefault === 1 ? '默认域' : '自定义域' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="描述">{{ selectedDomain?.description || '-' }}</a-descriptions-item>
          </a-descriptions>

          <a-divider>包含用户</a-divider>
          <div class="user-list">
            <a-tag v-for="user in domainUsers" :key="user.id" color="green" size="large">
              {{ user.nickname || user.username }} ({{ user.username }})
            </a-tag>
            <span v-if="domainUsers.length === 0" class="empty-text">暂无分配用户</span>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSysUsers, useDomains } from '@/composables'

const activeTab = ref('byUser')
const selectedUserId = ref<number | undefined>(undefined)
const selectedDomainId = ref<number | undefined>(undefined)

const { dataSource: userList, fetchData: fetchUsers } = useSysUsers()
const { dataSource: domainList, fetchData: fetchDomains } = useDomains()

const userDomains = ref<any[]>([])
const domainUsers = ref<any[]>([])
const allMenus = ref<any[]>([])
const selectedMenuKeys = ref<string[]>([])
const selectedDomain = ref<any>(null)

const menuTree = computed(() => {
  if (!allMenus.value || allMenus.value.length === 0) return []

  const buildTree = (parentId: number | null = null): any[] => {
    return allMenus.value
      .filter(m => m.parentId === parentId)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map(m => ({
        key: String(m.id),
        title: m.label,
        children: buildTree(m.id)
      }))
  }

  return buildTree(null)
})

async function handleUserChange(userId: number) {
  selectedUserId.value = userId
  selectedDomainId.value = undefined

  try {
    const res = await fetch(`/api/sys/users/${userId}/permissions`)
    const json = await res.json()
    if (json.code === 200) {
      userDomains.value = json.data.domains || []
      allMenus.value = json.data.menuTree || []
      selectedMenuKeys.value = []
    }
  } catch {
    userDomains.value = []
    allMenus.value = []
  }
}

async function handleDomainChange(domainId: number) {
  selectedDomainId.value = domainId
  selectedUserId.value = undefined

  try {
    const res = await fetch(`/api/sys/domains/${domainId}`)
    const json = await res.json()
    if (json.code === 200) {
      selectedDomain.value = json.data
    }
  } catch {
    selectedDomain.value = null
  }

  try {
    const res = await fetch(`/api/sys/domains/${domainId}/users`)
    const json = await res.json()
    if (json.code === 200) {
      domainUsers.value = json.data.users || []
    }
  } catch {
    domainUsers.value = []
  }
}

function filterUserOption(input: string, option: any) {
  const text = option.children?.()[0] || ''
  return text.toLowerCase().includes(input.toLowerCase())
}

onMounted(() => {
  fetchUsers()
  fetchDomains({ current: 1, size: 100 })
})
</script>

<style scoped>
.permission-query {
  padding: 24px;
}

.query-section {
  padding-top: 16px;
}

.query-header {
  margin-bottom: 24px;
}

.result-section {
  margin-top: 16px;
}

.domain-list,
.user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.menu-tree {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.empty-text {
  color: #999;
  font-size: 14px;
}
</style>
