# 材料申请列表页 UI 规范文档

## 概述

本文档用于 1:1 还原材料申请列表页的 UI 样式，适配 Stitch 设计工具。

---

## 一、主布局结构

### 1.1 整体布局架构

```
┌──────────────────────────────────────────────────────────────┐
│  MainLayout                                                   │
│  ├─ FirstSidebar (宽度: 126px, 固定左侧)                     │
│  │  ├─ 品牌区 (Brand Area)                                  │
│  │  ├─ 系统菜单-上 (首页、收藏)                             │
│  │  ├─ 业务菜单 (动态显示)                                  │
│  │  └─ 系统菜单-下 (个人信息)                               │
│  ├─ SecondSidebar (宽度: 220px, 悬浮/固定)                  │
│  └─ MainContent                                             │
│     ├─ TabBar (页签栏, 高度: 40px)                         │
│     └─ 内容区域 (ListPageTemplate)                          │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 主布局容器样式

```scss
.main-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background: #F5F5F5;
  overflow: hidden;
}

.main-content {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F5F5F5;
  min-width: 0; /* 防止 flex 子元素溢出 */
  z-index: 1;
}
```

---

## 二、一级导航 (FirstSidebar)

### 2.1 容器样式

```scss
.first-sidebar {
  width: 7.88rem;           // 126px
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0 1rem 0; // 上下 padding
  z-index: 2;
  background: #1F1F1F;     // 深色背景
}
```

### 2.2 品牌区 (Brand Area)

```scss
.brand-area {
  width: 7.88rem;           // 126px
  height: 3.75rem;         // 60px
  display: flex;
  flex-direction: column;
  padding: 0 0.75rem;       // 12px
  gap: 0.3125rem;           // 5px
  z-index: 1;
}

.logo-row {
  width: 6.38rem;          // 102px
  height: 1.5rem;          // 24px
  display: flex;
  align-items: center;
  gap: 0.5rem;             // 8px
}

.logo {
  width: 3.63rem;           // 58px
  height: 1.5rem;          // 24px
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo-icon {
  width: 100%;
  height: 1.5rem;
  object-fit: contain;
}

.dropdown-icon {
  width: 0.75rem;          // 12px
  height: 0.75rem;         // 12px
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  svg {
    width: 100%;
    height: 100%;
    color: rgba(255, 255, 255, 0.65);
  }
}

.domain-name {
  width: 6.38rem;
  height: 1.94rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  
  span {
    width: 6.38rem;
    height: 1.94rem;
    font-size: 1.38rem;    // 22px
    font-weight: 600;
    line-height: normal;
    color: #FFFFFF;
  }
}
```

### 2.3 系统菜单-上 (首页、收藏)

```scss
.system-menu-top {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  padding: 0 0.5rem;        // 8px
  gap: 0.25rem;             // 4px
  margin-top: 1.5rem;       // 24px
}

.divider {
  width: 5.88rem;           // 94px
  height: 0.06rem;          // 1px
  align-self: center;
  background: rgba(255, 255, 255, 0.2);
  margin-top: 4px;
  margin-bottom: 4px;
}
```

### 2.4 业务菜单 (Business Menus)

```scss
.business-menus {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0 0.5rem;        // 8px
  gap: 0.25rem;             // 4px
}
```

### 2.5 菜单项基础样式

```scss
.menu-item {
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  align-self: stretch;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  &:hover:not(.active) {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    color: #FFFFFF;
    background: #F95914;

    .menu-label {
      color: #FFFFFF;
    }
  }
}

.business-menu-item {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  align-self: stretch;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.2s;
  margin-bottom: 0;

  &:hover:not(.active) {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    color: #FFFFFF;
    background: #F95914;

    .menu-label {
      color: #FFFFFF;
    }
  }
}

.more-btn {
  &.active {
    color: rgba(255, 255, 255, 0.65);
    background: transparent;

    .menu-label {
      color: rgba(255, 255, 255, 0.65);
    }
  }
}
```

### 2.6 菜单图标样式

```scss
.menu-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor !important;
  stroke-width: 4;
  fill: none;
  flex-shrink: 0;
}
```

### 2.7 菜单文字样式

```scss
.menu-label {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  text-align: left;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.65);
  transition: color 0.25s ease, font-weight 0.2s ease;
}

.menu-label--normal {
  font-size: 14px;
  line-height: 22px;
}
```

### 2.8 系统菜单-下 (个人信息)

```scss
.system-menu-bottom {
  width: 126px;
  height: auto;
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  gap: 12px;
  align-self: stretch;
  z-index: 4;
}

.nav-divider {
  width: 102px;
  height: 1px;
  align-self: stretch;
  z-index: 0;
  opacity: 0.2;
  background: var(--ant-color-text-light-solid);
}

.person-info {
  width: 102px;
  height: 20px;
  display: flex;
  align-items: center;
  padding: 0;
  gap: 8px;
  align-self: stretch;
  z-index: 5;
}

.system-bottom-item {
  width: 102px;
  height: 20px;
  display: flex;
  align-items: center;
  padding: 0;
  gap: 8px;
  align-self: stretch;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.2s;
  z-index: 5;
  
  .menu-icon {
    width: 16px;
    height: 16px;
    stroke: currentColor !important;
    stroke-width: 4;
    fill: none;
    flex-shrink: 0;
  }
  
  .menu-label {
    font-family: PingFang SC;
    font-size: 12px;
    font-weight: normal;
    line-height: 20px;
    color: rgba(255, 255, 255, 0.65);
    white-space: nowrap;
  }
}

.person-info .avatar {
  width: 16px;
  height: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0;
  gap: 8px;
  z-index: 0;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 10px;
}

.person-info .name {
  font-family: PingFang SC;
  font-size: 12px;
  font-weight: normal;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.65);
}
```

### 2.9 自定义导航遮罩层

```scss
.custom-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
```

---

## 三、二级导航 (SecondSidebar)

### 3.1 容器样式

```scss
.second-sidebar {
  position: fixed;
  left: 7.88rem;            // 126px
  top: 0;
  width: 220px;
  min-width: 220px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  padding: 20px 8px 0;
  z-index: 100;
  box-shadow: 3px 0 5px rgba(0, 0, 0, 0.06);

  &.is-fixed {
    position: relative;
    left: 0;
    z-index: 1;
    box-shadow: none;
    border-right: none;
  }
}

.menu-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    display: none;
  }
}
```

### 3.2 菜单项样式

```scss
.menu-group {
  margin-bottom: 4px;
}

.menu-item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: pointer;
  color: #333333;
  transition: all 0.2s ease;
  position: relative;
  gap: 4px;
  border-radius: 4px;

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    color: var(--ant-color-primary, #F95914);
    background: #FFF7F0;
    font-weight: 500;

    .menu-label {
      color: var(--ant-color-primary, #F95914);
    }

    .favorite-icon {
      opacity: 1;
    }
  }

  &.parent {
    font-weight: 500;
    font-size: 14px;

    &:hover {
      background: #f5f5f5;
    }
  }

  &.child {
    padding-left: 38px;
    font-size: 13px;
    height: 40px;
  }

  &.single {
    font-size: 14px;
  }
}
```

### 3.3 菜单图标和文字

```scss
.menu-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor !important;
  stroke-width: 4;
  fill: none;
  flex-shrink: 0;
  color: inherit;

  .active & {
    color: inherit;
  }
}

.menu-label {
  flex: 1;
  font-family: PingFang SC;
  font-size: 14px;
  font-weight: normal;
  line-height: 22px;
  letter-spacing: normal;
  color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}
```

### 3.4 展开图标

```scss
.expand-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
  color: #999999;

  &.rotated {
    transform: rotate(180deg);
  }
}
```

### 3.5 收藏图标

```scss
.favorite-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }

  .child:hover &,
  &.favorited {
    opacity: 1;
  }

  &.favorited {
    stroke: none !important;
  }
}

// 菜单选中时：收藏图标显示主色
.child.active .favorite-icon {
  color: #F95914 !important;
}

// 收藏面板选中时：收藏图标显示主色
.menu-item.single.active .favorite-icon.active {
  color: #F95914 !important;
}
```

### 3.6 子菜单样式

```scss
.sub-menu {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
```

### 3.7 拖拽手柄

```scss
.drag-handle {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  cursor: grab;
  color: #999999;
  opacity: 0.5;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }
}

.ghost {
  opacity: 0.4;
  background: #f5f5f5;
}
```

### 3.8 收起/固定按钮

```scss
.collapse-container {
  flex-shrink: 0;
  padding: 5px 0;
}

.collapse-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0 0 5px 0;
}

.collapse-btn {
  height: 39px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  gap: 8px;
  cursor: pointer;
  border-radius: 8px;
  font-family: PingFang SC;
  font-size: 14px;
  font-weight: normal;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.45);

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
}

.collapse-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  stroke: currentColor;
  stroke-width: 0;
  fill: none;
  color: rgba(0, 0, 0, 0.45);
}
```

### 3.9 空状态提示

```scss
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  gap: 8px;
}

.empty-img {
  width: 60px;
  height: 60px;
}
```

---

## 四、页签栏 (TabBar)

### 4.1 容器样式

```scss
.tab-bar {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  flex-shrink: 0;
  background: transparent;
}

.tab-list {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}
```

### 4.2 页签项样式

```scss
.tab-item {
  position: relative;
  height: 1.75rem;          // 28px
  display: flex;
  align-items: center;
  padding: 0.19rem 0.5rem;  // 3px 8px
  gap: 0.375rem;            // 6px
  z-index: 1;
  border-radius: 0.25rem;   // 4px
  background: #F2F1F0;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    background: #F5F5F5;

    .tab-close {
      opacity: 1;
    }
  }

  &.active {
    z-index: 2;
    background: #F0EEED;

    .tab-label {
      font-family: PingFang SC;
      font-size: 14px;
      font-weight: normal;
      line-height: 1.38rem;
      color: var(--ant-color-text-heading);
    }

    .tab-close {
      width: 0.75rem;
      height: 0.75rem;
      z-index: 1;
    }
  }

  &.home-tab {
    &.active .tab-label {
      color: var(--ant-color-text-heading);
    }
  }
}
```

### 4.3 页签文字和关闭按钮

```scss
.tab-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
  margin-right: 6px;
}

.tab-close {
  width: 0.75rem;            // 12px
  height: 0.75rem;           // 12px
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.45);
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.action-icon {
  width: 18px;
  height: 18px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;

  &:hover {
    color: rgba(0, 0, 0, 0.88);
  }
}
```

---

## 五、更多菜单面板 (MoreMenuDrawer)

### 5.1 容器样式

```scss
.more-panel {
  position: fixed;
  left: 126px;
  top: 0;
  width: 816px;
  height: 100vh;
  background: #fff;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border-radius: 8px 0 0 8px;
  overflow: hidden;
}
```

### 5.2 搜索区域

```scss
.search-area {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 12px;
  z-index: 1;
}

.search-wrapper {
  width: 310px;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 5px 12px;
  gap: 12px;
  z-index: 0;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.2s;

  &:focus-within {
    border: 1px solid #F95914;
  }
}

.search-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1.5;
  fill: none;
  color: rgba(0, 0, 0, 0.65);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 32px;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 32px;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;

  &::placeholder {
    color: rgba(0, 0, 0, 0.25);
  }

  &:focus {
    color: rgba(0, 0, 0, 0.85);
  }
}

.close-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.65);
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    color: rgba(0, 0, 0, 0.85);
    background: rgba(0, 0, 0, 0.06);
  }
}
```

### 5.3 内容区域

```scss
.content-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}
```

### 5.4 左侧菜单列表

```scss
.menu-left {
  width: 201px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .menu-item {
    width: 100%;
    height: 40px;
    padding: 0 16px;
    margin: 0;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    z-index: 0;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
    box-sizing: border-box;

    &:hover {
      background: #fafafa;
      color: #333;
    }

    &.active {
      background: #FFF1E6;
      z-index: 1;
      color: #F95914;

      .menu-icon {
        color: #F95914;
      }
    }

    .menu-icon {
      width: 16px;
      height: 16px;
      z-index: 0;
      stroke: currentColor;
      fill: #323638;
      flex-shrink: 0;
    }

    .menu-label {
      flex: 1;
      height: 22px;
      z-index: 1;
      font-family: PingFang SC;
      font-size: 14px;
      font-weight: normal;
      line-height: 22px;
      color: rgba(0, 0, 0, 0.88);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .menu-item.active {
    .menu-label {
      color: #F95914;
    }
  }
}
```

### 5.5 自定义导航区域

```scss
.custom-nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
}

.custom-nav-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

.custom-nav-btn {
  width: 168px;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 2px 4px;
  gap: 4px;
  z-index: 1;
  border-radius: 2px;
  cursor: pointer;
  color: #999;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.2s;
  box-sizing: border-box;

  &:hover {
    color: #666;
    background: #fafafa;
  }

  .icon {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
}
```

### 5.6 右侧菜单区域

```scss
.menu-right {
  flex: 1;
  overflow-y: auto;
  padding: 0px 16px;
}

.menu-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  width: 583px;
  height: 38px;
  display: flex;
  align-items: center;
  padding: 8px 0px;
  gap: 10px;
  align-self: stretch;
  z-index: 0;

  .title-bar {
    width: 4px;
    height: 16px;
    z-index: 0;
    border-radius: 12px;
    background: #F95914;
  }

  .title-text {
    font-family: PingFang SC;
    font-size: 14px;
    font-weight: normal;
    line-height: 22px;
    letter-spacing: normal;
    color: rgba(0, 0, 0, 0.88);
  }
}
```

### 5.7 三级菜单

```scss
.level-3 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 0px;

  .menu-item {
    width: 184px;
    height: 28px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    margin: 0;
    border-radius: 4px;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.88);
    font-size: 14px;
    line-height: 18px;
    transition: all 0.2s;
    z-index: 3;
    box-sizing: border-box;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    &.active {
      background: rgba(0, 0, 0, 0.04);
      color: #F95914;

      .menu-label {
        color: #F95914;
      }
    }

    .menu-label {
      font-family: PingFang SC;
      font-size: 14px;
      font-weight: normal;
      line-height: 18px;
      letter-spacing: normal;
      color: rgba(0, 0, 0, 0.88);
      flex: 1;
    }

    .star-icon {
      width: 14px;
      height: 14px;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
      z-index: 2;

      .star-fill {
        opacity: 0;
        stroke: none !important;
        color: rgba(0, 0, 0, 0.45);
      }

      .star-outline {
        opacity: 0;
        color: rgba(0, 0, 0, 0.45);
      }

      &.is-favorited {
        .star-fill {
          opacity: 1;
        }
        .star-outline {
          opacity: 0;
        }
      }

      &:hover {
        .star-fill {
          opacity: 0;
        }
        .star-outline {
          opacity: 1;
        }
      }

      &.is-favorited:hover {
        .star-fill {
          opacity: 1;
        }
        .star-outline {
          opacity: 0;
        }
      }
    }

    &.active .star-icon {
      .star-fill,
      .star-outline {
        color: #F95914 !important;
        stroke: none !important;
      }
    }
  }
}
```

### 5.8 空状态

```scss
.no-data {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
```

---

## 六、自定义导航面板 (CustomNavPanel)

### 6.1 容器样式

```scss
.custom-nav-panel {
  position: fixed;
  left: 126px;
  top: 0;
  width: 320px;
  height: 100vh;
  background: #fff;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border-radius: 0;
  overflow: hidden;
}
```

### 6.2 面板头部

```scss
.panel-header {
  padding: 16px 14px 0;
  flex-shrink: 0;

  .panel-title {
    width: 96px;
    height: 24px;
    z-index: 0;
    font-family: PingFang SC;
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
    display: flex;
    align-items: flex-end;
    color: rgba(0, 0, 0, 0.88);
    margin: 0 0 4px;
  }

  .panel-desc {
    width: 292px;
    height: 22px;
    z-index: 1;
    font-family: PingFang SC;
    font-size: 14px;
    font-weight: normal;
    line-height: 22px;
    display: flex;
    align-items: flex-end;
    color: rgba(0, 0, 0, 0.45);
    margin: 0;
  }
}
```

### 6.3 面板内容

```scss
.panel-content {
  width: 320px;
  height: 1080px;
  display: flex;
  flex-direction: column;
  padding: 16px 14px;
  gap: 8px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 8px 0;
}
```

### 6.4 菜单项

```scss
.menu-item {
  width: 292px;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 2px 10px;
  margin: 0;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s ease;
  position: relative;
  z-index: 8;
  box-sizing: border-box;

  &:hover {
    border-color: rgba(0, 0, 0, 0.15);
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.5;
  }

  &.selected {
    border-color: #F95914;
  }

  &.empty-slot {
    border: 1px dashed #d9d9d9;
    background: #fafafa;
    color: #bfbfbf;
    cursor: default;

    .menu-label {
      font-style: italic;
    }

    &:hover {
      border-color: #F95914;
      transform: none;
      box-shadow: none;
    }
  }

  .nav-badge {
    font-size: 10px;
    color: rgba(0, 0, 0, 0.45);
    background: rgba(0, 0, 0, 0.04);
    padding: 4px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .drag-handle {
    width: 16px;
    height: 16px;
    z-index: 0;
    color: rgba(0, 0, 0, 0.45);
    flex-shrink: 0;
    margin-right: 24px;
  }

  .menu-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 8px;

    svg {
      width: 16px;
      height: 16px;
      color: rgba(0, 0, 0, 0.88);
      fill: none;
    }
  }

  .menu-label {
    flex: 1;
    height: 22px;
    z-index: 1;
    font-family: PingFang SC;
    font-size: 14px;
    font-weight: normal;
    line-height: 22px;
    color: rgba(0, 0, 0, 0.88);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
```

### 6.5 面板底部

```scss
.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 14px;
  flex-shrink: 0;

  .btn {
    padding: 8px 20px;
    font-size: 14px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: #f5f5f5;
    color: rgba(0, 0, 0, 0.88);

    &:hover {
      background: #e8e8e8;
    }
  }

  .btn-confirm {
    background: #F95914;
    color: #fff;

    &:hover {
      background: #e65112;
    }
  }
}
```

---

## 七、导航系统颜色规范

### 7.1 一级导航颜色

| 元素 | 颜色值 | 说明 |
|------|--------|------|
| 导航背景 | #1F1F1F | 深色背景 |
| 文字默认 | rgba(255, 255, 255, 0.65) | 65% 透明度白色 |
| 文字悬停 | #FFFFFF | 白色 |
| 文字选中 | #FFFFFF | 白色 |
| 背景悬停 | rgba(255, 255, 255, 0.08) | 8% 透明度白色 |
| 背景选中 | #F95914 | 主题橙色 |
| 分隔线 | rgba(255, 255, 255, 0.2) | 20% 透明度白色 |
| 下拉箭头 | rgba(255, 255, 255, 0.65) | 65% 透明度白色 |

### 7.2 二级导航颜色

| 元素 | 颜色值 | 说明 |
|------|--------|------|
| 导航背景 | #FFFFFF | 白色 |
| 边框 | #f0f0f0 | 浅灰 |
| 阴影 | rgba(0, 0, 0, 0.06) | 6% 透明度黑色 |
| 文字默认 | rgba(0, 0, 0, 0.88) | 88% 透明度黑色 |
| 文字辅助 | #999999 | 灰色 |
| 文字选中 | #F95914 | 主题橙色 |
| 背景悬停 | #f5f5f5 | 浅灰 |
| 背景选中 | #FFF7F0 | 浅橙色 |
| 收藏图标 | rgba(0, 0, 0, 0.45) | 45% 透明度黑色 |

### 7.3 页签栏颜色

| 元素 | 颜色值 | 说明 |
|------|--------|------|
| 页签默认 | #F2F1F0 | 浅灰背景 |
| 页签悬停 | #F5F5F5 | 更浅灰 |
| 页签选中 | #F0EEED | 选中灰 |
| 文字默认 | rgba(0, 0, 0, 0.65) | 65% 透明度黑色 |
| 文字选中 | var(--ant-color-text-heading) | 标题色 |
| 关闭按钮 | rgba(0, 0, 0, 0.45) | 45% 透明度黑色 |

### 7.4 更多菜单颜色

| 元素 | 颜色值 | 说明 |
|------|--------|------|
| 面板背景 | #FFFFFF | 白色 |
| 阴影 | rgba(0, 0, 0, 0.1) | 10% 透明度黑色 |
| 搜索框背景 | rgba(0, 0, 0, 0.02) | 2% 透明度黑色 |
| 搜索框聚焦 | #F95914 | 主题橙色边框 |
| 左侧边框 | #f0f0f0 | 浅灰 |
| 菜单默认 | #666666 | 灰色 |
| 菜单悬停 | #333333 | 深灰 |
| 菜单选中背景 | #FFF1E6 | 浅橙色 |
| 菜单选中文字 | #F95914 | 主题橙色 |
| 二级标题条 | #F95914 | 主题橙色 |
| 收藏图标 | rgba(0, 0, 0, 0.45) | 45% 透明度黑色 |

---

## 八、导航系统间距规范

### 8.1 一级导航间距

| 元素 | 间距值 |
|------|--------|
| 导航宽度 | 126px (7.88rem) |
| 导航内边距-左右 | 12px (0.75rem) |
| 导航内边距-上下 | 24px 16px |
| 系统菜单上边距 | 24px |
| 菜单项内边距 | 8px |
| 菜单项间距 | 4px |
| 菜单项高度 | 40px |
| 图标与文字间距 | 8px |
| Logo 高度 | 24px (1.5rem) |
| 域名文字大小 | 22px (1.38rem) |

### 8.2 二级导航间距

| 元素 | 间距值 |
|------|--------|
| 导航宽度 | 220px |
| 与一级导航间距 | 126px |
| 内边距 | 20px 8px 0 |
| 菜单项内边距 | 0 16px |
| 子菜单左边距 | 38px |
| 菜单项高度 | 40px |
| 菜单组间距 | 4px |
| 子菜单项间距 | 4px |
| 收起按钮高度 | 39px |

### 8.3 更多菜单间距

| 元素 | 间距值 |
|------|--------|
| 面板宽度 | 816px |
| 搜索区高度 | 64px |
| 搜索框宽度 | 310px |
| 左侧菜单宽度 | 201px |
| 右侧菜单宽度 | 583px |
| 三级菜单宽度 | 184px |
| 三级菜单高度 | 28px |
| 三级菜单间距 | 8px |
| 菜单项内边距 | 16px |

### 8.4 自定义导航面板间距

| 元素 | 间距值 |
|------|--------|
| 面板宽度 | 320px |
| 内边距 | 16px 14px |
| 菜单项宽度 | 292px |
| 菜单项高度 | 40px |
| 菜单项间距 | 8px |
| 按钮间距 | 12px |

---

## 九、导航系统字体规范

### 9.1 一级导航字体

| 元素 | 字号 | 行高 | 字重 |
|------|------|------|------|
| 域名 | 22px | - | 600 |
| 菜单文字 | 14px | 22px | 400 |
| 底部菜单 | 12px | 20px | 400 |
| 用户名 | 12px | 20px | 400 |

### 9.2 二级导航字体

| 元素 | 字号 | 行高 | 字重 |
|------|------|------|------|
| 父级菜单 | 14px | 22px | 500 |
| 子级菜单 | 13px | - | 400 |
| 单级菜单 | 14px | 22px | 400 |
| 收起按钮 | 14px | 22px | 400 |

### 9.3 页签栏字体

| 元素 | 字号 | 字重 |
|------|------|------|
| 页签文字 | 14px | 400 |

---

## 十、导航系统圆角规范

| 元素 | 圆角值 |
|------|--------|
| 一级菜单项 | 4px |
| 二级菜单项 | 4px |
| 更多面板 | 8px (左上左下) |
| 搜索框 | 4px |
| 三级菜单项 | 4px |
| 自定义面板菜单项 | 4px |
| 确认按钮 | 4px |
| 取消按钮 | 4px |
| 导航栏徽标 | 4px |

---

## 十一、页面整体布局

### 11.1 页面结构

```
┌─────────────────────────────────────────┐
│  ListPageTemplate                       │
│  ├─ page-header (高度: 48px)           │
│  │  ├─ page-title                     │
│  │  └─ page-header-actions            │
│  ├─ filter-gap (高度: 12px)            │
│  └─ content-card                       │
│     ├─ toolbar                         │
│     ├─ table-wrapper                   │
│     └─ pagination                      │
└─────────────────────────────────────────┘
```

### 11.2 容器样式

```scss
.list-page-template {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0rem 0.75rem;        // 左右 padding: 12px
  flex-grow: 1;
  align-self: stretch;
  z-index: 1;
  overflow: hidden;
}

.content-card {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;             // 内部 padding: 12px
  flex-grow: 1;
  align-self: stretch;
  z-index: 3;
  border-radius: 0.38rem 0.38rem 0rem 0rem;  // 左上右上圆角 6px
  background: #FFFFFF;
  overflow: hidden;
}
```

---

## 十二、页面标题区 (page-header)

### 12.1 容器样式

```scss
.page-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 0;
  gap: 16px;
  align-self: stretch;
  z-index: 0;
}
```

### 12.2 标题文字

```scss
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  margin: 0;
  line-height: 24px;
}
```

### 12.3 标题区操作按钮容器

```scss
.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 0;
  margin-right: 0;
  flex-shrink: 0;
}
```

### 12.4 分隔线

```scss
.page-header-line {
  width: 1px;
  height: 14px;
  background-color: #d9d9d9;
  flex-shrink: 0;
}
```

---

## 十三、筛选表单区 (FilterForm)

### 13.1 容器样式

```scss
.filter-form {
  background: #fff;
  padding: 0.625rem 0.75rem;    // 上下: 10px, 左右: 12px
  border-radius: 0.38rem;        // 圆角: 6px
}
```

### 13.2 筛选项样式

```scss
.filter-item {
  display: flex;
  flex-direction: column;
  width: 100%;

  :deep(.ant-form-item-label) {
    width: 80px;
    flex-shrink: 0;

    > label {
      justify-content: flex-end;
      width: 100%;
    }
  }

  :deep(.ant-form-item-control) {
    flex: 1;
    min-width: 0;
  }

  :deep(.ant-input),
  :deep(.ant-select),
  :deep(.ant-picker) {
    width: 100%;
  }
}
```

### 13.3 按钮组容器

```scss
.btn-col {
  display: flex;
  justify-content: flex-end;

  :deep(.ant-form-item) {
    margin-bottom: 0;
  }

  :deep(.ant-space) {
    display: flex;
    justify-content: flex-end;
  }

  :deep(.ant-space-item) {
    margin: 6px 0;
  }

  :deep(.ant-btn) {
    box-shadow: none;
  }
}
```

### 13.4 展开/收起按钮

```scss
:deep(.expand-btn) {
  width: auto;
  height: 22px;
  display: flex;
  align-items: center;
  padding: 0;
  gap: 4px;
  font-family: PingFang SC;
  font-size: 14px;
  font-weight: normal;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.88);

  &:hover {
    color: #F95914 !important;
  }

  &:active {
    color: rgba(0, 0, 0, 0.88) !important;
  }

  &:focus {
    color: rgba(0, 0, 0, 0.88) !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .arrow-icon {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .expand-text {
    color: rgba(0, 0, 0, 0.88) !important;
  }
}
```

### 13.5 筛选表单通用样式

```scss
:deep(.ant-form-item) {
  margin-bottom: 0;
}

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-picker),
:deep(.ant-form-item-label > label) {
  margin: 6px 0;
}

:deep(.ant-select-selection-item) {
  color: rgba(0, 0, 0, 0.85);
}
```

---

## 十四、工具栏 (Toolbar)

### 14.1 工具栏容器

```scss
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### 14.2 图标按钮样式

```scss
.icon-only-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 32px;
  height: 32px;

  &:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  &:active {
    outline: none !important;
    box-shadow: none !important;
  }
}

.icon-only-btn :deep(.anticon) {
  margin: 0;
}

.icon-only-btn :deep(svg) {
  width: 16px !important;
  height: 16px !important;
}
```

---

## 十五、表格区 (Table)

### 15.1 表格容器

```scss
.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

:deep(.ant-table) {
  border-radius: 0;
}

:deep(.ant-table-thead > tr > th) {
  border-top: none;
  border-radius: 0;
}
```

### 15.2 表格列定义

| 列名 | 字段 | 宽度 | 固定 |
|------|------|------|------|
| 材料名称 | materialName | 180px | 左侧固定 |
| 申请单号 | applicationNo | 150px | - |
| 状态 | status | 100px | - |
| 规格型号 | spec | 120px | - |
| 单位 | unit | 80px | - |
| 申请数量 | quantity | 100px | - |
| 申请人 | applicant | 100px | - |
| 部门 | department | 100px | - |
| 申请日期 | applyTime | 220px | - |
| 操作 | action | 148px | 右侧固定 |

---

## 十六、分页区 (Pagination)

### 16.1 分页容器

```scss
.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  flex-shrink: 0;
}
```

---

## 十七、状态标签样式

### 17.1 状态映射

| 状态值 | 显示文字 | CSS 类名 |
|--------|----------|----------|
| draft | 草稿 | default |
| pending | 审核中 | status-pending |
| approved | 已通过 | status-approved |
| rejected | 已拒绝 | status-rejected |

### 17.2 状态标签通用样式

```scss
.status-pending {
  color: #faad14;
  background: #fffbe6;
  border-color: #ffe58f;
}

.status-approved {
  color: #52c41a;
  background: #f6ffed;
  border-color: #b7eb8f;
}

.status-rejected {
  color: #f5222d;
  background: #fff1f0;
  border-color: #ffa39e;
}
```

---

## 十八、下拉菜单样式

### 18.1 下拉按钮样式

```scss
:deep(.dropdown-text-btn) {
  display: inline-flex !important;
  align-items: center !important;
  color: rgba(0, 0, 0, 0.88) !important;
  font-weight: normal !important;
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  padding-left: 4px !important;
  padding-right: 0px !important;

  &:hover,
  &:focus,
  &:focus-visible,
  &:active {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    color: rgba(0, 0, 0, 0.88) !important;
  }
}
```

### 18.2 已修改标签

```scss
.modified-tag-inline {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  color: #F95914;
  background-color: #FFF2E8;
  border-radius: 3px;
  margin-left: 6px;
  flex-shrink: 0;
}
```

### 18.3 视图选项

```scss
:deep(.scheme-option) {
  display: flex;
  align-items: center;
  width: 100%;
}

:deep(.scheme-option .action-icons) {
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.scheme-option:hover .action-icons) {
  opacity: 1;
}

:deep(.scheme-option .action-icon) {
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

:deep(.scheme-option .action-icon.edit-icon) {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

:deep(.scheme-option .action-icon.edit-icon:hover) {
  color: #F95914;
}

:deep(.scheme-option .action-icon.delete-icon:hover) {
  color: #ff4d4f;
}
```

### 18.4 保存按钮样式

```scss
:deep(.save-filter-btn) {
  height: 26px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}
```

---

## 十九、抽屉弹窗样式

### 19.1 抽屉容器

```scss
.drawer-content {
  padding: 0 0;
  overflow: visible;
}
```

### 19.2 表单项

```scss
.form-item {
  margin-bottom: 32px;
}

.form-label {
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.88);
  margin-bottom: 8px;
}

.required-star {
  color: #ff4d4f;
  margin-left: 4px;
}
```

### 19.3 输入框字数统计

```scss
.input-with-count {
  position: relative;
  width: 100%;
}

.input-with-count :deep(.ant-input-affix-wrapper) {
  width: 100%;
}

.word-count {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  pointer-events: none;
  background: #fff;
  padding-left: 4px;
}
```

### 19.4 筛选列表

```scss
.filter-list-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 8px;
}

.filter-list-container {
  padding: 0;
}

.filter-item {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
  margin: 0;
  border-radius: 4px;
  cursor: move;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  &:active {
    background-color: #e6e6e6;
  }
}

.filter-row {
  display: flex;
  align-items: center;
}

.default-value-row {
  padding-left: 44px;
  margin-top: 4px;
  margin-bottom: 4px;
}

.drag-icon {
  width: 12px;
  height: 12px;
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.45);
  flex-shrink: 0;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}
```

---

## 二十、颜色规范

### 20.1 主题色

| 用途 | 色值 |
|------|------|
| 主色调 | #F95914 (橙色) |
| 主色调背景 | #FFF2E8 / #FFF1E6 / #FFF7F0 |
| 成功色 | #52c41a |
| 警告色 | #faad14 |
| 危险色 | #f5222d / #ff4d4f |
| 默认色 | #000000 (0.88 透明度) |

### 20.2 文字颜色

| 用途 | 色值 |
|------|------|
| 主要文字 | rgba(0, 0, 0, 0.88) |
| 次要文字 | rgba(0, 0, 0, 0.45) |
| 表单标签 | rgba(0, 0, 0, 0.85) |
| 禁用文字 | rgba(0, 0, 0, 0.25) |

### 20.3 边框颜色

| 用途 | 色值 |
|------|------|
| 分隔线 | #d9d9d9 |
| 表格边框 | #f0f0f0 |
| 状态边框-警告 | #ffe58f |
| 状态边框-成功 | #b7eb8f |
| 状态边框-危险 | #ffa39e |

### 20.4 背景颜色

| 用途 | 色值 |
|------|------|
| 页面背景 | #f0f2f5 |
| 卡片背景 | #FFFFFF |
| 筛选区背景 | #FFFFFF |
| 表格表头 | #fafafa |
| 状态背景-警告 | #fffbe6 |
| 状态背景-成功 | #f6ffed |
| 状态背景-危险 | #fff1f0 |
| 悬停背景 | #f5f5f5 |
| 拖拽中背景 | #e6e6e6 |

---

## 二十一、字体规范

### 21.1 字体族

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
```

### 21.2 字号规范

| 用途 | 字号 | 行高 |
|------|------|------|
| 页面标题 | 16px | 24px |
| 正文 | 14px | 22px |
| 辅助文字 | 12px | 20px |
| 标签文字 | 11px | - |

### 21.3 字重规范

| 用途 | 字重 |
|------|------|
| 页面标题 | 600 (Semi Bold) |
| 正文 | 400 (Regular) |
| 按钮 | 400 (Regular) |

---

## 二十二、图标规范

### 22.1 图标来源

所有图标使用 IconPark 图标库，定义在 index.html 或 sprite.svg 中。

### 22.2 图标引用方式

```html
<svg viewBox="0 0 48 48" style="width: 16px; height: 16px">
  <use href="#图标名称" />
</svg>
```

### 22.3 常用图标

| 图标用途 | 图标名称 |
|----------|----------|
| 向上箭头 | up |
| 向下箭头 | down |
| 刷新 | refresh |
| 设置 | setting |
| 拖拽 | drag |
| 编辑 | writing-fluently |
| 删除 | delete (使用文字 ✕) |
| 更多 | more-two |
| 收藏(线框) | star |
| 收藏(实心) | star-fill |
| 全屏 | fullscreen |
| 关闭 | close |
| 搜索 | search |

---

## 二十三、动画与交互

### 23.1 过渡动画

| 交互 | 时长 | 缓动函数 |
|------|------|----------|
| 按钮/链接悬停 | 0.2s | ease |
| 下拉菜单 | 0.2s | ease |
| 拖拽列表项 | 0.2s | ease |
| 菜单文字颜色 | 0.25s | ease |
| 展开图标旋转 | 0.2s | ease |

### 23.2 交互状态

- **hover**: 颜色变化至 #F95914
- **focus**: 移除轮廓和阴影
- **active**: 恢复默认颜色
- **disabled**: 透明度 0.25

---

## 二十四、Stitch 适配建议

### 24.1 命名规范

| 元素 | Stitch 命名 |
|------|-------------|
| 主布局 | main_layout |
| 一级导航 | first_sidebar |
| 二级导航 | second_sidebar |
| 页签栏 | tab_bar |
| 更多菜单 | more_menu_panel |
| 自定义导航 | custom_nav_panel |
| 页面标题 | page_title |
| 筛选表单 | filter_form |
| 工具栏 | toolbar |
| 数据表格 | data_table |
| 分页器 | pagination |
| 状态标签 | status_badge |

### 24.2 组件导出

建议将以下部分作为独立组件导出：

1. `MainLayout` - 主布局容器
2. `FirstSidebar` - 一级导航
3. `SecondSidebar` - 二级导航
4. `TabBar` - 页签栏
5. `MoreMenuDrawer` - 更多菜单面板
6. `CustomNavPanel` - 自定义导航面板
7. `PageHeader` - 页面标题区
8. `FilterForm` - 筛选表单
9. `Toolbar` - 工具栏
10. `DataTable` - 数据表格
11. `Pagination` - 分页器
12. `StatusBadge` - 状态标签

### 24.3 设计稿导出设置

- 画板宽度: 1440px (桌面端参考)
- 画板高度: 900px (可滚动区域)
- 命名规范: 语义化命名
- 图层分组: 按功能模块分组
- 样式信息: 保留所有样式属性

---

## 二十五、完整样式速查表

### 25.1 导航容器类

| 类名 | 主要属性 |
|------|----------|
| .main-layout | flex 布局, 100vh 高度 |
| .first-sidebar | width 126px, 深色背景 |
| .second-sidebar | width 220px, 固定定位 |
| .more-panel | width 816px, 阴影效果 |
| .custom-nav-panel | width 320px, 阴影效果 |
| .tab-bar | height 40px, flex 布局 |

### 25.2 菜单项类

| 类名 | 主要属性 |
|------|----------|
| .menu-item | flex, height 40px, 圆角 4px |
| .business-menu-item | flex, height 40px, 业务菜单 |
| .system-bottom-item | flex, height 20px, 系统菜单 |
| .tab-item | flex, height 28px, 圆角 4px |

### 25.3 文字类

| 类名 | 主要属性 |
|------|----------|
| .menu-label | 14px, 400, 白色/黑色 |
| .domain-name | 22px, 600, 白色 |
| .tab-label | 14px, 65% 透明度 |
| .page-title | 16px, 600, 黑色 88% |

---

**文档版本**: v2.0
**最后更新**: 2026-04-20
**适用页面**: 材料申请列表页 + 一二级导航系统
