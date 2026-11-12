import { get, post } from '@/utils/request'

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
  key: string
  name: string | null
  version: number
  deploymentId: string
  deployTime: string | null
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

export async function fetchTodo(params: { current: number; size: number; keyword?: string }) {
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

export async function fetchDone(params: { current: number; size: number }) {
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

export async function fetchProcessDefinitions() {
  return get<ProcessDefItem[]>(`${BASE}/process-definitions`)
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

export async function fetchCcMine(params: { current: number; size: number }) {
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

export async function fetchStatsOverview() {
  return get<StatsOverview>(`${BASE}/stats/overview`)
}

export async function fetchStatsByProcess() {
  return get<ProcessStat[]>(`${BASE}/stats/by-process`)
}

export async function fetchStatsTrend(days = 14) {
  return get<TrendPoint[]>(`${BASE}/stats/trend`, { days })
}
