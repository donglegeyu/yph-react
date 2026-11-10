# 弹窗 / 抽屉 / 独立页面选型规则

> Last updated: 2026-10-30

## 决策背景

项目中列表页的"新增/编辑"表单到底用 Modal、Drawer 还是跳独立页面，之前没有统一口径，导致不同页面形态各异（部分用 Modal、部分用独立 FormPageTemplate）。为此定一条固定规则。

## 选型原则

| 场景 | 推荐形态 | 说明 |
|------|---------|------|
| **新增** | 🔴 一律用 **Drawer**（右侧抽屉） | 不打断列表上下文，填写过程中还能瞥见表格数据做参照 |
| **编辑（内容少，1–2 屏）** | Drawer | 字段少、不需要跳转的场景，和新增保持一致 |
| **编辑（内容多，复杂表单 / 多 Tab / 含子表）** | 独立**页面**（FormPageTemplate） | 字段多到 Drawer 塞不下、或需要完整页宽展示时用 |
| **仅查看 / 只读详情** | Drawer | 纯展示，宽度不够时才跳独立详情页 |
| **二次确认（删/停/启用）** | Modal | 只有几行文字 + 确认按钮，Drawer 过重 |

## 关键要点

- **新增 = Drawer，不再用 Modal**。Modal 适合二次确认这种"聚焦阻断"场景，不适合承载录入表单
- **新增和编辑的形态必须一致**，同一张表的新增/编辑要么都 Drawer、要么都页面，不允许一个 Drawer 一个 Modal
- **Drawer 的 OK/Cancel 按钮**：Drawer 不像 Modal 自带 footer，需要自己在抽屉底部用 `<CompanyButton>` 组合
- **🔴 Drawer 默认宽度 440px**（紧凑合理的表单宽度，统一视觉）；字段较多或含 textarea 时可放宽到 520px；**600px 以上建议跳独立页面**（说明内容已经超出抽屉合理容量）

## 技术落地（公司组件）

```tsx
import { CompanyDrawer, CompanyButton } from '@donglegeyu/company-ui'

<CompanyDrawer
  title="新增模型配置"
  open={modalOpen}
  width={560}
  onClose={() => setModalOpen(false)}
  footer={
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      <CompanyButton onClick={() => setModalOpen(false)}>取消</CompanyButton>
      <CompanyButton type="primary" loading={saving} onClick={handleSave}>保存</CompanyButton>
    </div>
  }
>
  <BaseInfoForm ... />
</CompanyDrawer>
```

## 反模式（禁止）

- ❌ 新增表单用 Modal + destroyOnHidden（2026-10-30 发现 ModelManagement 就是这种，已改 Drawer）
- ❌ 同一张表：新增 Drawer、编辑 Modal（形态不一致让用户困惑）
