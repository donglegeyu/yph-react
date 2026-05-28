<template>
  <div class="material-create">
    <a-card title="新增材料申请" class="page-card">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="vertical"
      >
        <!-- 基本信息 -->
        <a-divider>基本信息</a-divider>
        <a-row :gutter="24">
          <a-col :span="8">
            <a-form-item label="申请单号" name="applicationNo">
              <a-input v-model:value="form.applicationNo" placeholder="系统自动生成" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="申请人" name="applicant">
              <a-input v-model:value="form.applicant" placeholder="请输入申请人" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="部门" name="department">
              <a-select v-model:value="form.department" placeholder="请选择部门">
                <a-select-option value="engineering">工程部</a-select-option>
                <a-select-option value="procurement">采购部</a-select-option>
                <a-select-option value="finance">财务部</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 材料信息 -->
        <a-divider>材料信息</a-divider>
        <a-row :gutter="24">
          <a-col :span="8">
            <a-form-item label="材料名称" name="materialName">
              <a-input v-model:value="form.materialName" placeholder="请输入材料名称" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="规格型号" name="spec">
              <a-input v-model:value="form.spec" placeholder="请输入规格型号" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="单位" name="unit">
              <a-input v-model:value="form.unit" placeholder="如：个、米、套" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="8">
            <a-form-item label="申请数量" name="quantity">
              <a-input-number v-model:value="form.quantity" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="预计单价" name="estimatedPrice">
              <a-input-number v-model:value="form.estimatedPrice" :min="0" :precision="2" style="width: 100%">
                <template #addonAfter>元</template>
              </a-input-number>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="预计总价" name="estimatedTotal">
              <a-input-number v-model:value="form.estimatedTotal" :min="0" :precision="2" disabled style="width: 100%">
                <template #addonAfter>元</template>
              </a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 供应商信息 -->
        <a-divider>供应商信息</a-divider>
        <a-form-item label="选择供应商">
          <a-table
            :columns="supplierColumns"
            :data-source="suppliers"
            :pagination="{ pageSize: 5 }"
            :row-selection="{ type: 'radio', selectedRowKeys: selectedSupplierKeys }"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'isDefault'">
                <a-tag v-if="record.isDefault" color="orange">默认</a-tag>
              </template>
            </template>
          </a-table>
        </a-form-item>

        <!-- 期望交付 -->
        <a-divider>期望交付</a-divider>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="期望交付日期" name="expectedDate">
              <a-date-picker v-model:value="(form.expectedDate as any)" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="紧急程度" name="urgency">
              <a-radio-group v-model:value="form.urgency">
                <a-radio value="normal">普通</a-radio>
                <a-radio value="urgent">紧急</a-radio>
                <a-radio value="very-urgent">非常紧急</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 用途说明 -->
        <a-divider>用途说明</a-divider>
        <a-form-item label="使用场景" name="usageScenario">
          <a-textarea v-model:value="form.usageScenario" :rows="3" placeholder="请描述材料的使用场景" />
        </a-form-item>
        <a-form-item label="项目信息" name="projectInfo">
          <a-textarea v-model:value="form.projectInfo" :rows="2" placeholder="请输入关联项目信息" />
        </a-form-item>

        <!-- 附件上传 -->
        <a-divider>附件</a-divider>
        <a-form-item label="上传图片">
          <a-upload
            v-model:file-list="fileList"
            action="/api/upload"
            list-type="picture-card"
            accept="image/*"
          >
            <div v-if="fileList.length < 9">
              <svg viewBox="0 0 48 48" style="width: 32px; height: 32px">
                <use href="#add" />
              </svg>
              <div>上传</div>
            </div>
          </a-upload>
        </a-form-item>

        <!-- 备注 -->
        <a-divider>备注</a-divider>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="form.remark" :rows="3" placeholder="请输入备注信息" />
        </a-form-item>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <a-space>
            <a-button type="primary" @click="handleSubmit">提交审核</a-button>
            <a-button @click="handleSaveDraft">保存草稿</a-button>
          </a-space>
          <a-button @click="handleBack">返回</a-button>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
// @ts-expect-error - 暂时未使用
const formRef = ref()

const form = reactive({
  applicationNo: '',
  applicant: '',
  department: undefined,
  materialName: '',
  spec: '',
  unit: '',
  quantity: 1,
  estimatedPrice: 0,
  estimatedTotal: 0,
  expectedDate: null,
  urgency: 'normal',
  usageScenario: '',
  projectInfo: '',
  remark: '',
})

const rules = {
  applicant: [{ required: true, message: '请输入申请人' }],
  department: [{ required: true, message: '请选择部门' }],
  materialName: [{ required: true, message: '请输入材料名称' }],
  quantity: [{ required: true, message: '请输入申请数量' }],
}

const fileList = ref<any[]>([])
const selectedSupplierKeys = ref<number[]>([])

const supplierColumns = [
  { title: '供应商名称', dataIndex: 'name', key: 'name' },
  { title: '联系人', dataIndex: 'contact', key: 'contact' },
  { title: '电话', dataIndex: 'phone', key: 'phone' },
  { title: '默认供应商', key: 'isDefault' },
]

const suppliers = ref([
  { id: 1, name: '深圳市xxx建材有限公司', contact: '张三', phone: '13800138001', isDefault: true },
  { id: 2, name: '广州xxx装饰材料商行', contact: '李四', phone: '13800138002', isDefault: false },
  { id: 3, name: '东莞市xxx五金批发部', contact: '王五', phone: '13800138003', isDefault: false },
])

function handleSubmit() {
  console.log('submit', form)
  router.push('/materials')
}

function handleSaveDraft() {
  console.log('save draft')
}

function handleBack() {
  router.back()
}
</script>

<style scoped lang="scss">
.material-create {
  .page-card {
    border-radius: 8px;
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #F0F0F0;
  }
}

:deep(.ant-divider) {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}
</style>
