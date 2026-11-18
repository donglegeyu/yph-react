import request, { get, post, put, del } from '@/utils/request'

const BASE = '/api/approval'

/** 后端返回 ISO 本地时间，列表统一展示为 yyyy-MM-dd HH:mm:ss */
export function fmtTime(value?: string | null): string {
  return value ? value.replace('T', ' ').slice(0, 19) : '-'
}

export interface PageData<T> {
  records: T[]
  total: number
  current: number
  size: number
}

export interface TaskItem {
  taskId: string
  taskName: string
  processInstanceId: string
  processName: string | null
  title: string | null
  applicantName: string | null
  createTime: string | null
}

export interface TaskTimelineItem {
  taskName: string | null
  action: string | null
  operatorName: string | null
  comment: string | null
  time: string | null
}

export interface TaskDetail {
  taskId: string
  taskName: string
  processInstanceId: string
  processName: string | null
  title: string | null
  businessNo: string | null
  applicantId: number | null
  applicantName: string | null
  status: string | null
  formData: string | null
  createTime: string | null
  timeline: TaskTimelineItem[]
}

export interface InstanceItem {
  instanceId: string
  processName: string | null
  title: string | null
  businessNo: string | null
  status: string
  startTime: string | null
  endTime: string | null
}

export interface DoneItem {
  taskId: string
  processInstanceId: string
  processName: string | null
  title: string | null
  action: string
  comment: string | null
  handleTime: string | null
}

export interface ProcessDefItem {
  id: string
  key: string
  name: string | null
  version: number
  deploymentId: string
  deployTime: string | null
  suspended: boolean
}

export interface CurrentNode {
  nodeKey: string
  nodeName: string | null
  assigneeId: string | null
}

export interface InstanceDetail {
  instanceId: string
  processName: string | null
  title: string | null
  businessNo: string | null
  status: string
  formData: string | null
  startTime: string | null
  endTime: string | null
  currentNodes: CurrentNode[]
  timeline: TaskTimelineItem[]
}

export interface CcItem {
  id: number
  instanceId: string
  title: string | null
  businessNo: string | null
  status: string
  receiverName: string | null
  readStatus: number
  createTime: string | null
}

export interface SysUserItem {
  id: number
  username: string
  nickname: string | null
  realName: string | null
  deptName: string | null
}

export interface SysUserOption {
  label: string
  value: number
}

/** 审批实例状态展示元数据（列表 Tag 与详情抽屉共用），取值来自 appr_business_link.status */
export const INSTANCE_STATUS_META: Record<
  string,
  { text: string; color: 'processing' | 'success' | 'error' | 'default' }
> = {
  running: { text: '进行中', color: 'processing' },
  approved: { text: '已完成', color: 'success' },
  rejected: { text: '已驳回', color: 'error' },
  withdrawn: { text: '已撤回', color: 'default' },
}

/** 审批动作文案映射（时间线与已办列表共用） */
export function actionText(action: string | null): string {
  if (action === 'approve') return '同意'
  if (action === 'reject') return '驳回'
  if (action === 'transfer') return '转办'
  if (action === 'add_sign') return '加签'
  return action || '-'
}

/** 用户列表转下拉选项：显示名（账号） */
export function toUserOptions(users: SysUserItem[]): SysUserOption[] {
  return users.map((user) => ({
    value: user.id,
    label: `${user.realName || user.nickname || user.username}（${user.username}）`,
  }))
}

export async function fetchTodo(params: {
  current: number
  size: number
  keyword?: string
  applicantName?: string
}) {
  return get<PageData<TaskItem>>(`${BASE}/tasks/todo`, params)
}

export async function fetchTaskDetail(taskId: string) {
  return get<TaskDetail>(`${BASE}/tasks/${taskId}`)
}

export async function approveTask(taskId: string, comment: string) {
  return post<null>(`${BASE}/tasks/${taskId}/approve`, { comment })
}

export async function rejectTask(taskId: string, comment: string) {
  return post<null>(`${BASE}/tasks/${taskId}/reject`, { comment })
}

export async function fetchMine(params: { current: number; size: number; status?: string }) {
  return get<PageData<InstanceItem>>(`${BASE}/instances/mine`, params)
}

export async function fetchDone(params: {
  current: number
  size: number
  processName?: string
  title?: string
  myAction?: string
  comment?: string
  handleTimeFrom?: string
  handleTimeTo?: string
}) {
  return get<PageData<DoneItem>>(`${BASE}/instances/done`, params)
}

export async function startInstance(data: {
  title: string
  reason?: string
  amount?: number
  ccUserIds?: number[]
}) {
  return post<{ instanceId: string; businessNo: string }>(`${BASE}/instances`, data)
}

export async function fetchProcessDefinitions(params: {
  name?: string
  suspended?: string
  deployTimeFrom?: string
  deployTimeTo?: string
} = {}) {
  return get<ProcessDefItem[]>(`${BASE}/process-definitions`, params)
}

/** 流程图：PNG 裸字节（非 ApiResult 包装），以 blob 返回 */
export async function fetchProcessDefinitionDiagram(definitionId: string): Promise<Blob> {
  const res = await request.get<Blob>(`${BASE}/process-definitions/${definitionId}/diagram`, {
    responseType: 'blob',
  })
  return res.data
}

export function fetchProcessDefinitionXml(definitionId: string) {
  return get<string>(`${BASE}/process-definitions/${definitionId}/xml`)
}

export async function suspendProcessDefinition(definitionId: string) {
  return put<null>(`${BASE}/process-definitions/${definitionId}/suspend`, {})
}

export async function activateProcessDefinition(definitionId: string) {
  return put<null>(`${BASE}/process-definitions/${definitionId}/activate`, {})
}

export async function deleteProcessDeployment(deploymentId: string, cascade = false) {
  return del<null>(`${BASE}/process-definitions/deployments/${deploymentId}?cascade=${cascade}`)
}

export interface DeployResult {
  id: string
  key: string
  name: string
  version: number
}

export interface ProcessDesignItem {
  id: number
  processKey: string
  name: string
  designJson: string | null
  publishedVersion: number
  updateTime: string | null
}

export async function fetchProcessDesigns() {
  return get<ProcessDesignItem[]>(`${BASE}/process-designs`)
}

export async function fetchProcessDesign(id: number) {
  return get<ProcessDesignItem>(`${BASE}/process-designs/${id}`)
}

export async function createProcessDesign(name: string, processKey?: string) {
  return post<ProcessDesignItem>(`${BASE}/process-designs`, { name, processKey: processKey || undefined })
}

export async function saveProcessDesign(id: number, data: { name?: string; designJson?: string }) {
  return put<ProcessDesignItem>(`${BASE}/process-designs/${id}`, data)
}

export async function publishProcessDesign(id: number) {
  return post<DeployResult>(`${BASE}/process-designs/${id}/publish`, {})
}


export async function fetchInstanceDetail(instanceId: string) {
  return get<InstanceDetail>(`${BASE}/instances/${instanceId}`)
}

export async function withdrawInstance(instanceId: string, comment?: string) {
  return post<null>(`${BASE}/instances/${instanceId}/withdraw`, comment ? { comment } : {})
}

export async function urgeInstance(instanceId: string) {
  return post<null>(`${BASE}/instances/${instanceId}/urge`, {})
}

export async function transferTask(taskId: string, targetId: number, targetName: string, comment?: string) {
  return post<null>(`${BASE}/tasks/${taskId}/transfer`, { targetId, targetName, comment })
}

export async function addSignTask(taskId: string, targetId: number, targetName: string, comment?: string) {
  return post<null>(`${BASE}/tasks/${taskId}/add-sign`, { targetId, targetName, comment })
}

export async function fetchCcMine(params: {
  current: number
  size: number
  title?: string
  businessNo?: string
  status?: string
  readStatus?: number
  createTimeFrom?: string
  createTimeTo?: string
}) {
  return get<PageData<CcItem>>(`${BASE}/cc/mine`, params)
}

export async function markCcRead(id: number) {
  return post<null>(`${BASE}/cc/${id}/read`, {})
}

/** 主服务用户列表（转办/加签/抄送选人共用），一次拉取后本地搜索过滤 */
export async function fetchSysUsers(params: { current?: number; size?: number; username?: string } = {}) {
  return get<SysUserItem[]>('/api/sys/users', { current: 1, size: 200, ...params })
}

export interface StatsOverview {
  todoCount: number
  runningCount: number
  approvedCount: number
  rejectedCount: number
  withdrawnCount: number
  monthStarted: number
  avgDurationHours: number | null
}

export interface ProcessStat {
  defKey: string
  defName: string | null
  total: number
  running: number
  approved: number
  rejected: number
  withdrawn: number
  avgDurationHours: number | null
}

export interface TrendPoint {
  date: string
  started: number
  completed: number
}

/** 统计筛选参数：companyId=公司（部门树顶级节点 id），period=month/quarter/year */
export interface StatsFilter {
  companyId?: number
  period?: 'month' | 'quarter' | 'year'
}

export async function fetchStatsOverview(filter?: StatsFilter) {
  return get<StatsOverview>(`${BASE}/stats/overview`, {
    companyId: filter?.companyId,
    period: filter?.period,
  })
}

export async function fetchStatsByProcess(filter?: StatsFilter) {
  return get<ProcessStat[]>(`${BASE}/stats/by-process`, {
    companyId: filter?.companyId,
    period: filter?.period,
  })
}

export async function fetchStatsTrend(days = 14, filter?: StatsFilter) {
  return get<TrendPoint[]>(`${BASE}/stats/trend`, {
    days,
    companyId: filter?.companyId,
  })
}

/** 待办任务页统计卡片（当前用户维度，登录即可） */
export interface MyCards {
  myTodoCount: number
  approachingOverdueCount: number
  overdueCount: number
  submitFailCount: number
}

export async function fetchMyCards() {
  return get<MyCards>(`${BASE}/stats/my-cards`)
}

// ---------------- 业务流程配置（审批绑定管理） ----------------

export interface BusinessBindingItem {
  id: number
  businessType: string
  businessName: string
  processKey: string | null
  approvalMode: 'required' | 'optional'
  enabled: boolean
  remark: string | null
  updateTime: string | null
}

/** 绑定列表 */
export async function fetchBusinessBindings(params: {
  keyword?: string
  businessName?: string
  businessType?: string
  processKey?: string
  approvalMode?: string
  enabled?: string
  updateTimeFrom?: string
  updateTimeTo?: string
} = {}) {
  return get<BusinessBindingItem[]>(`${BASE}/business-bindings`, params)
}

/** 保存绑定：有 id/匹配 businessType 时更新，否则新增 */
export async function saveBusinessBinding(data: {
  businessType: string
  businessName: string
  processKey?: string | null
  approvalMode: 'required' | 'optional'
  enabled: boolean
  remark?: string | null
}) {
  return post<BusinessBindingItem>(`${BASE}/business-bindings`, data)
}

export async function toggleBusinessBinding(id: number, enabled: boolean) {
  return put<null>(`${BASE}/business-bindings/${id}/enabled`, { enabled })
}

/** 主服务已注册回调处理器的业务类型白名单（新增绑定下拉用） */
export async function fetchRegisteredBusinessTypes() {
  return get<{ value: string; label: string }[]>('/api/internal/approval-business-types')
}
