<template>
  <div class="material-detail">
    <a-card title="材料申请详情" class="page-card">
      <template #extra>
        <a-space>
          <a-button @click="handleBack">返回</a-button>
          <a-button type="primary" @click="handleEdit">编辑</a-button>
        </a-space>
      </template>

      <!-- Tab 切换 -->
      <a-tabs v-model:active-key="activeTab">
        <a-tab-pane key="detail" tab="详情">
          <!-- 基本信息 -->
          <a-divider>基本信息</a-divider>
          <a-descriptions :column="3" bordered size="small">
            <a-descriptions-item label="申请单号">MA202603090001</a-descriptions-item>
            <a-descriptions-item label="申请人">张三</a-descriptions-item>
            <a-descriptions-item label="部门">工程部</a-descriptions-item>
            <a-descriptions-item label="申请日期">2026-03-27</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag color="success">已通过</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="紧急程度">
              <a-tag color="warning">紧急</a-tag>
            </a-descriptions-item>
          </a-descriptions>

          <!-- 材料信息 -->
          <a-divider>材料信息</a-divider>
          <a-descriptions :column="3" bordered size="small">
            <a-descriptions-item label="材料名称">水泥</a-descriptions-item>
            <a-descriptions-item label="规格型号">P.O 42.5</a-descriptions-item>
            <a-descriptions-item label="单位">吨</a-descriptions-item>
            <a-descriptions-item label="申请数量">10</a-descriptions-item>
            <a-descriptions-item label="预计单价">450.00 元</a-descriptions-item>
            <a-descriptions-item label="预计总价">4500.00 元</a-descriptions-item>
            <a-descriptions-item label="期望交付日期" :span="3">2026-04-15</a-descriptions-item>
          </a-descriptions>

          <!-- 用途说明 -->
          <a-divider>用途说明</a-divider>
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="使用场景">用于A栋楼地基施工</a-descriptions-item>
            <a-descriptions-item label="项目信息">项目编号：PRJ-2026-001</a-descriptions-item>
          </a-descriptions>

          <!-- 审核信息 -->
          <a-divider>审核信息</a-divider>
          <a-timeline>
            <a-timeline-item color="green">
              <p><strong>提交申请</strong> - 2026-03-27 10:30 张三</p>
              <p class="text-secondary">提交材料申请，等待审核</p>
            </a-timeline-item>
            <a-timeline-item color="green">
              <p><strong>初审通过</strong> - 2026-03-27 14:20 李四</p>
              <p class="text-secondary">材料符合规格要求</p>
            </a-timeline-item>
            <a-timeline-item color="green">
              <p><strong>终审通过</strong> - 2026-03-28 09:15 王五</p>
              <p class="text-secondary">审核通过，同意采购</p>
            </a-timeline-item>
          </a-timeline>
        </a-tab-pane>

        <a-tab-pane key="supplier" tab="供应商">
          <a-descriptions title="供应商信息" :column="2" bordered size="small">
            <a-descriptions-item label="供应商名称">深圳市xxx建材有限公司</a-descriptions-item>
            <a-descriptions-item label="联系人">张三</a-descriptions-item>
            <a-descriptions-item label="联系电话">13800138001</a-descriptions-item>
            <a-descriptions-item label="电子邮箱">zhangsan@example.com</a-descriptions-item>
            <a-descriptions-item label="地址" :span="2">深圳市南山区xxx路xxx号</a-descriptions-item>
            <a-descriptions-item label="银行账号">6222021234567890</a-descriptions-item>
            <a-descriptions-item label="开户行">中国工商银行深圳分行</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>

        <a-tab-pane key="images" tab="图片">
          <a-row :gutter="16">
            <a-col :span="6" v-for="i in 6" :key="i">
              <a-card hoverable class="image-card">
                <template #cover>
                  <div class="image-placeholder">
                    <svg viewBox="0 0 48 48" style="width: 48px; height: 48px; opacity: 0.3">
                      <use href="#image" />
                    </svg>
                    <div>材料图片 {{ i }}</div>
                  </div>
                </template>
                <a-card-meta title="材料图片 {{ i }}" description="上传时间：2026-03-27" />
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref('detail')

function handleBack() {
  router.push('/materials')
}

function handleEdit() {
  console.log('edit', route.params.id)
}
</script>

<style scoped lang="scss">
.material-detail {
  .page-card {
    border-radius: 8px;
  }

  .text-secondary {
    color: rgba(0, 0, 0, 0.45);
    font-size: 13px;
    margin-top: 4px;
  }

  .image-card {
    margin-bottom: 16px;

    .image-placeholder {
      height: 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #F5F5F5;
      color: rgba(0, 0, 0, 0.25);
    }
  }
}
</style>
