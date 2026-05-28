# 📋 前端代码审查报告

**审查时间**: 2026-04-27 00:03:43
**项目目录**: material-system

## 🔍 检查 !important 使用

❌ **发现      170 处使用 !important**

### 详情（前30个）

```bash
material-system/src/components/ListPageTemplate.vue:/* 保存筛选按钮 - 移除 !important，使用 CSS 变量 */
material-system/src/components/SmartListTemplate.vue:  outline: none !important;
material-system/src/components/SmartListTemplate.vue:  box-shadow: none !important;
material-system/src/components/SmartListTemplate.vue:  width: 16px !important;
material-system/src/components/SmartListTemplate.vue:  height: 16px !important;
material-system/src/components/SmartListTemplate.vue:  display: inline-flex !important;
material-system/src/components/SmartListTemplate.vue:  align-items: center !important;
material-system/src/components/SmartListTemplate.vue:  color: rgba(0, 0, 0, 0.88) !important;
material-system/src/components/SmartListTemplate.vue:  font-weight: normal !important;
material-system/src/components/SmartListTemplate.vue:  background: transparent !important;
material-system/src/components/SmartListTemplate.vue:  border-color: transparent !important;
material-system/src/components/SmartListTemplate.vue:  box-shadow: none !important;
material-system/src/components/SmartListTemplate.vue:  outline: none !important;
material-system/src/components/SmartListTemplate.vue:  padding-left: 4px !important;
material-system/src/components/SmartListTemplate.vue:  padding-right: 0px !important;
material-system/src/components/SmartListTemplate.vue:    background: transparent !important;
material-system/src/components/SmartListTemplate.vue:    border-color: transparent !important;
material-system/src/components/SmartListTemplate.vue:    box-shadow: none !important;
material-system/src/components/SmartListTemplate.vue:    outline: none !important;
material-system/src/components/SmartListTemplate.vue:    color: rgba(0, 0, 0, 0.88) !important;
material-system/src/components/SmartListTemplate.vue:  height: 26px !important;
material-system/src/components/SmartListTemplate.vue:  padding-left: 8px !important;
material-system/src/components/SmartListTemplate.vue:  padding-right: 8px !important;
material-system/src/components/layout/MoreMenuDrawer.vue:        stroke: none !important;
material-system/src/components/layout/MoreMenuDrawer.vue:        color: #F95914 !important;
material-system/src/components/layout/MoreMenuDrawer.vue:        stroke: none !important;
material-system/src/components/layout/MoreMenuDrawer.vue:        opacity: 1 !important;
material-system/src/components/layout/MoreMenuDrawer.vue:        opacity: 0 !important;
material-system/src/components/layout/MoreMenuDrawer.vue:        opacity: 1 !important;
material-system/src/components/layout/MoreMenuDrawer.vue:        opacity: 0 !important;
```

## 🎨 检查内联样式

⚠️ **发现       79 处内联样式**

### 详情（前30个）

```bash
material-system/src/components/ListPageTemplate.vue:            <svg viewBox="0 0 48 48" style="width:14px;height:14px;margin-left:4px" class="dropdown-arrow">
material-system/src/components/ListPageTemplate.vue:                  <span style="font-size: 12px; color: rgba(0, 0, 0, 0.45);">（全量）</span>
material-system/src/components/ListPageTemplate.vue:                  <span style="margin-left: 0px; font-size: 12px; color: rgba(0, 0, 0, 0.45);">（{{ scheme.filterOrder?.length || 0 }}）</span>
material-system/src/components/SmartListTemplate.vue:            style="color: rgba(0, 0, 0, 0.88); background: transparent; border-color: transparent; box-shadow: none; outline: none;"
material-system/src/components/SmartListTemplate.vue:            <svg viewBox="0 0 48 48" style="width:16px;height:16px;margin-left:4px">
material-system/src/components/SmartListTemplate.vue:                  <span style="font-size: 12px; color: rgba(0, 0, 0, 0.45);">（全量）</span>
material-system/src/components/SmartListTemplate.vue:                  <span style="margin-left: 0px; font-size: 12px; color: rgba(0, 0, 0, 0.45);">（{{ scheme.filterOrder?.length || 0 }}）</span>
material-system/src/components/SmartListTemplate.vue:                <span style="color: #F95914">+ 新增视图</span>
material-system/src/components/SmartListTemplate.vue:      :footer-style="{ textAlign: 'right' }"
material-system/src/components/SmartListTemplate.vue:        <div class="form-item" style="margin-top: 32px;">
material-system/src/components/SmartListTemplate.vue:                  style="width: 100%;"
material-system/src/components/SmartListTemplate.vue:                  style="width: 100%;"
material-system/src/components/layout/FirstSidebar.vue:        <svg class="menu-icon" style="color: inherit;">
material-system/src/components/layout/FirstSidebar.vue:        <svg class="menu-icon" style="color: inherit;">
material-system/src/components/layout/FirstSidebar.vue:        <svg class="menu-icon" style="color: inherit;">
material-system/src/components/layout/FirstSidebar.vue:        <svg class="menu-icon" style="color: inherit;">
material-system/src/components/ActionCell.vue:          <svg viewBox="0 0 48 48" style="width:16px;height:16px">
material-system/src/components/ColumnSettingsPanel.vue:    :overlay-style="{ width: '180px', margin: '6px 0 0 0' }"
material-system/src/components/ColumnSettingsPanel.vue:    :overlay-inner-style="{ width: '100%', maxHeight: '280px', padding: 0 }"
material-system/src/components/FilterForm.vue:          :style="{ marginLeft: 'auto' }"
material-system/src/components/FilterForm.vue:                <svg class="arrow-icon" viewBox="0 0 48 48" style="width:14px;height:14px">
material-system/src/components/FilterForm.vue:              style="width: 100%"
material-system/src/components/FilterForm.vue:              style="width: 100%"
material-system/src/components/GlobalSelect.vue:    style="width: 100%"
material-system/src/components/IconSelect.vue:    style="width: 100%"
material-system/src/components/FilterOptionsDrawer.vue:    :footer-style="{ textAlign: 'right' }"
material-system/src/components/FilterOptionsDrawer.vue:              style="width: 100%;"
material-system/src/components/FilterOptionsDrawer.vue:              style="width: 100%;"
material-system/src/components/FilterOptionsDrawer.vue:      <a-button type="primary" @click="handleSave" style="margin-left: 8px">
material-system/src/views/common/ComponentPreview.vue:                             :style="{ backgroundColor: token.currentValue }">
```

## 🔎 检查 :deep() 选择器

⚠️ **发现       86 处使用 :deep() 选择器**

### 详情（前30个）

```bash
material-system/src/components/ListPageTemplate.vue::deep(.ant-table) {
material-system/src/components/ListPageTemplate.vue::deep(.ant-table-thead > tr > th) {
material-system/src/components/SmartListTemplate.vue:.icon-only-btn :deep(.anticon) {
material-system/src/components/SmartListTemplate.vue:.icon-only-btn :deep(svg) {
material-system/src/components/SmartListTemplate.vue::deep(.export-dropdown-btn) {
material-system/src/components/SmartListTemplate.vue::deep(.dropdown-arrow) {
material-system/src/components/SmartListTemplate.vue::deep(.dropdown-text-btn) {
material-system/src/components/SmartListTemplate.vue::deep(.scheme-option) {
material-system/src/components/SmartListTemplate.vue::deep(.scheme-option .action-icons) {
material-system/src/components/SmartListTemplate.vue::deep(.scheme-option:hover .action-icons) {
material-system/src/components/SmartListTemplate.vue::deep(.scheme-option .action-icon) {
material-system/src/components/SmartListTemplate.vue::deep(.scheme-option .action-icon.edit-icon) {
material-system/src/components/SmartListTemplate.vue::deep(.scheme-option .action-icon.edit-icon:hover) {
material-system/src/components/SmartListTemplate.vue::deep(.scheme-option .action-icon.delete-icon:hover) {
material-system/src/components/SmartListTemplate.vue::deep(.save-filter-btn) {
material-system/src/components/SmartListTemplate.vue:.input-with-count :deep(.ant-input-affix-wrapper) {
material-system/src/components/SmartListTemplate.vue::deep(.ant-table) {
material-system/src/components/SmartListTemplate.vue::deep(.ant-table-thead > tr > th) {
material-system/src/components/ActionCell.vue:/* 下拉触发器样式 - 使用 :deep() 但移除 !important */
material-system/src/components/ActionCell.vue::deep(.ant-dropdown-trigger) {
material-system/src/components/ActionCell.vue::deep(.ant-btn-link) {
material-system/src/components/ActionCell.vue::deep(.ant-btn-link:hover),
material-system/src/components/ActionCell.vue::deep(.ant-btn-link:focus) {
material-system/src/components/FilterForm.vue:  :deep(.ant-form-item-label) {
material-system/src/components/FilterForm.vue:  :deep(.ant-form-item-control) {
material-system/src/components/FilterForm.vue:  :deep(.ant-input),
material-system/src/components/FilterForm.vue:  :deep(.ant-select),
material-system/src/components/FilterForm.vue:  :deep(.ant-picker) {
material-system/src/components/FilterForm.vue::deep(.ant-form-item) {
material-system/src/components/FilterForm.vue::deep(.ant-input),
```

## 🌈 检查硬编码品牌色 (#F95914)

⚠️ **发现       45 处硬编码品牌色 #F95914**

### 详情（前30个）

```bash
material-system/src/App.vue:const savedThemeColor = localStorage.getItem('theme:color') || '#F95914'
material-system/src/components/ListPageTemplate.vue:  color: var(--ant-color-primary, #F95914);
material-system/src/components/ListPageTemplate.vue:  background: var(--ant-color-primary, #F95914);
material-system/src/components/ListPageTemplate.vue:  border-color: var(--ant-color-primary, #F95914);
material-system/src/components/ListPageTemplate.vue:  color: var(--ant-color-primary, #F95914);
material-system/src/components/SmartListTemplate.vue:                <span style="color: #F95914">+ 新增视图</span>
material-system/src/components/SmartListTemplate.vue:    color: #F95914;
material-system/src/components/SmartListTemplate.vue:  color: #F95914;
material-system/src/components/SmartListTemplate.vue:    border: 1px dashed #F95914;
material-system/src/components/layout/MoreMenuDrawer.vue:    border: 1px solid #F95914;
material-system/src/components/layout/MoreMenuDrawer.vue:      color: #F95914;
material-system/src/components/layout/MoreMenuDrawer.vue:        color: #F95914;
material-system/src/components/layout/MoreMenuDrawer.vue:      color: #F95914;
material-system/src/components/layout/MoreMenuDrawer.vue:    background: #F95914;
material-system/src/components/layout/MoreMenuDrawer.vue:      color: #F95914;
material-system/src/components/layout/MoreMenuDrawer.vue:        color: #F95914;
material-system/src/components/layout/MoreMenuDrawer.vue:        color: #F95914 !important;
material-system/src/components/layout/SecondSidebar.vue:    color: var(--ant-color-primary, #F95914);
material-system/src/components/layout/SecondSidebar.vue:      color: var(--ant-color-primary, #F95914);
material-system/src/components/layout/SecondSidebar.vue:  color: #F95914 !important;
material-system/src/components/layout/SecondSidebar.vue:  color: #F95914 !important;
material-system/src/components/layout/FirstSidebar.vue:    background: #F95914;
material-system/src/components/layout/FirstSidebar.vue:    background: #F95914;
material-system/src/components/layout/FirstSidebar.vue:    background: #F95914;
material-system/src/components/layout/CustomNavPanel.vue:    border-color: #F95914;
material-system/src/components/layout/CustomNavPanel.vue:      border-color: #F95914;
material-system/src/components/layout/CustomNavPanel.vue:    background: #F95914;
material-system/src/components/ActionCell.vue:  color: var(--ant-color-primary, #F95914);
material-system/src/components/ActionCell.vue:  color: var(--ant-color-primary, #F95914);
material-system/src/components/ColumnSettingsPanel.vue:  border-color: #F95914;
```

## 🎨 检查其他危险颜色

⚠️ **发现        5 处危险操作颜色（红色）**

### 详情（前20个）

```bash
material-system/src/components/ListPageTemplate.vue:          color: #ff4d4f;
material-system/src/components/SmartListTemplate.vue:  color: #ff4d4f;
material-system/src/components/SmartListTemplate.vue:  color: #ff4d4f;
material-system/src/components/IconSelect.vue:  color: #ff4d4f;
material-system/src/components/FilterOptionsDrawer.vue:      color: #ff4d4f;
```

## 📊 审查总结

| 检查项 | 数量 | 状态 |
|--------|------|------|
| !important 使用 |      170 | ❌ 需要修复 |
| 内联样式 |       79 | ⚠️ 建议优化 |
| :deep() 选择器 |       86 | ⚠️ 建议优化 |
| 硬编码品牌色 |       45 | ⚠️ 建议优化 |
| 危险操作颜色 |        5 | ⚠️ 建议优化 |

## 💡 优化建议


---
*此报告由代码审查脚本自动生成*

