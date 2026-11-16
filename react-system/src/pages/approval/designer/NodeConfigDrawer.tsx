import { useEffect, useMemo } from 'react'
import {
  DrawerFormTemplate,
  CompanyForm,
  CompanyInput,
  CompanyInputNumber,
  CompanyRadio,
  CompanySelect,
  CompanyTag,
} from '@donglegeyu/company-ui'
import { useSysUsers } from '../useSysUsers'
import { toUserOptions, type SysUserOption } from '../api'
import type { ConditionOp, DesignNode } from './types'
import { OP_OPTIONS, genNodeId } from './types'
import './designer.scss'

type DrawerValues = {
  name: string
  assigneeType?: 'member' | 'role'
  mode?: 'any' | 'all'
  assigneeIds?: number[]
  roleCode?: string
  ccIds?: number[]
  branches?: { name: string; op: string | null; value: number | null }[]
}

const TYPE_TITLE: Record<string, string> = {
  start: '发起人节点',
  approve: '审批节点',
  cc: '抄送节点',
  condition: '条件分支',
  end: '结束节点',
}

interface NodeConfigDrawerProps {
  open: boolean
  node: DesignNode | null
  onClose: () => void
  onSubmit: (node: DesignNode) => void
}

export default function NodeConfigDrawer({ open, node, onClose, onSubmit }: NodeConfigDrawerProps) {
  const [form] = CompanyForm.useForm()
  const { users, loading: userLoading } = useSysUsers()
  const userOptions: SysUserOption[] = useMemo(() => toUserOptions(users), [users])
  const userNameById = useMemo(
    () => new Map(users.map((user) => [user.id, user.realName || user.nickname || user.username])),
    [users],
  )

  useEffect(() => {
    if (!open || !node) return
    form.setFieldsValue({
      name: node.name,
      assigneeType: node.assigneeType ?? 'member',
      mode: node.mode ?? 'any',
      assigneeIds: node.assigneeIds ?? [],
      roleCode: node.roleCode,
      ccIds: node.ccIds ?? [],
      branches: (node.branches ?? []).map((branch) => ({
        name: branch.name,
        op: branch.op ?? undefined,
        value: branch.value ?? undefined,
      })),
    })
  }, [open, node, form])

  const handleSubmit = () => {
    form
      .validateFields()
      .then((rawValues) => {
        const values = rawValues as DrawerValues
        if (!node) return
        const next: DesignNode = { ...node, name: (values.name ?? '').trim() }
        if (next.type === 'approve') {
          const memberIds: number[] = values.assigneeType === 'role' ? [] : values.assigneeIds ?? []
          next.assigneeType = values.assigneeType
          next.assigneeIds = memberIds.length ? memberIds : undefined
          next.assigneeNames = memberIds.length
            ? memberIds.map((id) => userNameById.get(id) ?? String(id))
            : undefined
          next.mode = values.assigneeType === 'role' ? undefined : values.mode
          next.roleCode = values.assigneeType === 'role' ? (values.roleCode ?? '').trim() : undefined
        } else if (next.type === 'cc') {
          const ccIds: number[] = values.ccIds ?? []
          next.ccIds = ccIds.length ? ccIds : undefined
          next.ccNames = ccIds.length ? ccIds.map((id) => userNameById.get(id) ?? String(id)) : undefined
        } else if (next.type === 'condition') {
          const raw = values.branches ?? []
          next.branches = raw.map((branch, index) => {
            const existing = node.branches?.[index]
            const isLast = index === raw.length - 1
            return {
              id: existing?.id ?? genNodeId(),
              name: (branch.name ?? '').trim(),
              priority: index + 1,
              op: isLast ? null : ((branch.op ?? null) as ConditionOp | null),
              value: isLast ? null : branch.value ?? null,
              nodes: existing?.nodes ?? [],
            }
          })
        }
        onSubmit(next)
      })
      .catch(() => undefined)
  }

  const type = node?.type ?? 'approve'

  return (
    <DrawerFormTemplate
      open={open}
      onClose={onClose}
      title={`编辑${TYPE_TITLE[type] ?? '节点'}`}
      width={480}
      onSubmit={handleSubmit}
      destroyOnHidden
    >
      <div className="pd-config-form">
        <CompanyForm form={form} layout="vertical">
        <CompanyForm.Item name="name" label="节点名称" rules={[{ required: true, message: '请输入节点名称' }]}>
          <CompanyInput placeholder="请输入节点名称" />
        </CompanyForm.Item>

        {type === 'approve' && (
          <>
            <CompanyForm.Item name="assigneeType" label="审批人类型" preserve={false}>
              <CompanyRadio.Group
                options={[
                  { label: '指定成员', value: 'member' },
                  { label: '指定角色', value: 'role' },
                ]}
              />
            </CompanyForm.Item>
            <CompanyForm.Item noStyle shouldUpdate={(prev, cur) => prev.assigneeType !== cur.assigneeType}>
              {({ getFieldValue }) =>
                getFieldValue('assigneeType') === 'role' ? (
                  <CompanyForm.Item
                    name="roleCode"
                    label="角色编码"
                    preserve={false}
                    rules={[{ required: true, message: '请输入角色编码，如 ROLE_ADMIN' }]}
                  >
                    <CompanyInput placeholder="请输入角色编码，如 ROLE_ADMIN" />
                  </CompanyForm.Item>
                ) : (
                  <>
                    <CompanyForm.Item name="mode" label="审批方式" preserve={false}>
                      <CompanyRadio.Group
                        options={[
                          { label: '或签（一人通过即过）', value: 'any' },
                          { label: '会签（全部通过才过）', value: 'all' },
                        ]}
                      />
                    </CompanyForm.Item>
                    <CompanyForm.Item
                      name="assigneeIds"
                      label="审批人"
                      preserve={false}
                      rules={[{ required: true, message: '请选择审批人' }]}
                    >
                      <CompanySelect
                        mode="multiple"
                        showSearch
                        optionFilterProp="label"
                        options={userOptions}
                        loading={userLoading}
                        placeholder="请选择审批人"
                      />
                    </CompanyForm.Item>
                  </>
                )
              }
            </CompanyForm.Item>
          </>
        )}

        {type === 'cc' && (
          <CompanyForm.Item name="ccIds" label="抄送人">
            <CompanySelect
              mode="multiple"
              showSearch
              optionFilterProp="label"
              options={userOptions}
              loading={userLoading}
              placeholder="请选择抄送人"
            />
          </CompanyForm.Item>
        )}

        {type === 'condition' && (
          <CompanyForm.List name="branches">
            {(fields) => (
              <>
                {fields.map((field, index) => {
                  const isLast = index === fields.length - 1
                  return (
                    <div className="pd-branch-editor" key={field.key}>
                      <div className="pd-branch-editor-head">
                        <CompanyTag>{`优先级${index + 1}`}</CompanyTag>
                        {isLast && <CompanyTag color="default">默认分支</CompanyTag>}
                      </div>
                      <CompanyForm.Item
                        name={[field.name, 'name']}
                        label="分支名称"
                        rules={[{ required: true, message: '请输入分支名称' }]}
                      >
                        <CompanyInput placeholder="请输入分支名称" />
                      </CompanyForm.Item>
                      {!isLast && (
                        <div className="pd-branch-editor-cond">
                          <CompanyForm.Item
                            name={[field.name, 'op']}
                            label="条件（申请金额）"
                            rules={[{ required: true, message: '请选择条件' }]}
                          >
                            <CompanySelect options={OP_OPTIONS} placeholder="请选择条件" />
                          </CompanyForm.Item>
                          <CompanyForm.Item
                            name={[field.name, 'value']}
                            label="金额"
                            rules={[{ required: true, message: '请输入金额' }]}
                          >
                            <CompanyInputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
                          </CompanyForm.Item>
                        </div>
                      )}
                      <div className="pd-branch-editor-tip">分支内节点请在画布上添加</div>
                    </div>
                  )
                })}
              </>
            )}
          </CompanyForm.List>
        )}

        {(type === 'start' || type === 'end') && (
          <div className="pd-drawer-tip">该节点为流程骨架节点，仅需维护名称</div>
        )}
        </CompanyForm>
      </div>
    </DrawerFormTemplate>
  )
}
