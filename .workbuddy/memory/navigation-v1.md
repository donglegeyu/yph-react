# 一二级导航交互逻辑 - 版本记录

> 文件：material-system/src/components/layout/FirstSidebar.vue
> 提交：a1aeebb "feat: 一二级导航交互逻辑优化 - 悬浮/固定模式分离，hover样式修复"
> 状态：**已保存，请勿随意修改**

---

## 📋 当前实现的行为

### 固定模式（secondSidebarFixed = true）
| 操作 | 行为 |
|------|------|
| 悬停业务菜单 | 只改变样式（半透明背景），**不切换二级菜单** |
| 点击业务菜单 | 切换显示对应的二级菜单 |
| 悬停首页/收藏 | 首页隐藏面板，收藏显示面板（仅悬浮模式生效） |

### 悬浮模式（secondSidebarFixed = false）
| 操作 | 行为 |
|------|------|
| 悬停业务菜单 | 显示对应二级菜单，保持选中状态 |
| 移开鼠标 | 隐藏二级菜单面板 |
| 点击业务菜单 | 切换显示对应的二级菜单 |

---

## 🔧 核心实现

### 1. 悬浮状态标记
```typescript
const isHovering = ref(false)
```

### 2. 业务菜单 Hover 处理
```typescript
function handleBusinessMenuHover(menu: any) {
  if (!appStore.secondSidebarFixed) {
    isHovering.value = true
    appStore.activeFirstMenu = menu.key
    appStore.cancelHideSidebar()
  }
}

function handleBusinessMenuLeave() {
  isHovering.value = false
  appStore.delayHideSidebar()
}
```

### 3. 监听器（防止自动改变 activeKey）
```typescript
watch(() => appStore.activeFirstMenu, (newFirstMenu) => {
  if (!isHovering.value && newFirstMenu && newFirstMenu !== 'home' && newFirstMenu !== 'favorites') {
    activeKey.value = newFirstMenu
  }
})
```

### 4. CSS Hover 样式（关键）
```scss
&:hover:not(.active) {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}
```
- **作用**：hover 时不会覆盖 active 选中状态
- **受影响选择器**：`.menu-item`, `.business-menu-item`, `.menu-item--normal`

---

## ⚠️ 重要提醒

1. **已提交版本**：git commit a1aeebb
2. **禁止随意修改**：除非用户明确要求，否则不要修改此文件的交互逻辑
3. **如需修改**：先备份当前版本，修改后记录变更说明

---

## 📝 版本历史

### v1.0 (当前版本)
- ✅ 悬浮/固定模式逻辑分离
- ✅ hover 样式修复（不覆盖 active）
- ✅ 二级面板跟随悬停切换
- ✅ 保持选中状态不变
- 提交：a1aeebb
