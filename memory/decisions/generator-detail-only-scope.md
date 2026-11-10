# D007: 页面生成器向导本轮迭代只改详情页模板

> Last updated: 2026-10-10
> Status: Active（会话级约束，本轮迭代结束后可删除或归档）

## 决策

2026-10-10 起的页面生成器（新建页面配置 PageGeneratorWizard）UI 微调工作中，**只允许修改详情页模板（pageType = 'detail'）相关内容**，不碰列表页模板。

## 范围内（可以改）

- `PageGeneratorWizard.tsx` 中详情页的配置区块：
  - 基本信息（含「关联列表页」「同步字段」）
  - 头部信息（`detailHeader`：主名称字段、标签 tags、标题栏操作按钮 titleActions）
  - 详情字段（`config.fields`，详情页展示项）
  - 正文信息（`detailHeader.tabs`，Tab 配置）
- 详情页预览渲染（PreviewPanel 中 detail 分支）
- 详情页运行时页面（DynamicDetailPage，确有需要时）
- `PageGeneratorWizard.scss` 中仅供详情页区块使用的样式；改共享类（如 `.pgw-toolbar`、`.pgw-field-header`）时必须确认列表页区块的表现符合预期，必要时用 `.pgw-editor--*` 或详情页父级类限定

## 范围外（禁止改，除非用户另行明确授权）

- 列表页模板区块：筛选区、列表「字段配置」（约 L1787）、「操作列按钮」actions（约 L1848）、「工具栏按钮」toolbarButtons（约 L1949）
- 页面生成器以外的其他业务模块/页面

## 背景

用户在逐轮微调向导配置面板时，明确划定本次对话的修改边界，防止把详情页的样式/交互调整顺手扩散到列表页配置区块。

## 相关文件

- [PageGeneratorWizard.tsx](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/generator/PageGeneratorWizard.tsx)
- [PageGeneratorWizard.scss](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/generator/PageGeneratorWizard.scss)
