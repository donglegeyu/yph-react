# Design Token 第二阶段部署说明

## 📋 阶段概述

第二阶段实现了：
- ✅ **组件级 Token**：6 个常用组件（Button、Input、Table、Form、Modal、Card）的精细化定制
- ✅ **深色模式**：一键切换暗色主题
- ✅ **主题持久化**：服务器端保存用户主题偏好

---

## 🚀 部署步骤

### 1. 数据库迁移

```bash
# 进入 MySQL 容器
docker exec -it material-mysql mysql -u root -proot123456

# 选择数据库
USE material_system;

# 执行第二阶段脚本
SOURCE /path/to/design_token_v2_component_and_dark_mode.sql;

# 验证组件 Token
SELECT component_name, COUNT(*) as count FROM component_token GROUP BY component_name;

-- 预期结果：
-- +----------------+-------+
-- | component_name | count |
-- +----------------+-------+
-- | Button         |    18 |
-- | Card           |    10 |
-- | Form           |    12 |
-- | Input          |    16 |
-- | Modal          |    10 |
-- | Table          |    18 |
-- +----------------+-------+

# 验证主题配置
SELECT * FROM theme_config;

-- 预期结果：
-- +----+------------+-----------+
-- | id | theme_name | is_active |
-- +----+------------+-----------+
-- |  1 | light      |         1 |
-- |  2 | dark       |         0 |
-- +----+------------+-----------+
```

### 2. 后端代码部署

确保以下文件已部署：

#### 新增实体类
- ✅ `entity/ThemeConfig.java` - 主题配置实体
- ✅ `entity/ComponentToken.java` - 组件 Token 实体

#### 新增 Controller
- ✅ `controller/ThemeController.java` - 主题切换 API

#### 重建后端镜像
```bash
# 停止旧容器
docker stop material-backend

# 重新构建镜像
docker build -t material-backend-new:latest .

# 启动新容器
docker run -d --name material-backend \
  --network material-network \
  -p 8080:8080 \
  material-backend-new:latest

# 检查日志
docker logs -f material-backend
```

### 3. 前端代码部署

#### 新增文件
- ✅ `composables/useDarkMode.ts` - 深色模式 Hook
- ✅ `assets/styles/dark-mode.scss` - 深色模式样式

#### 修改文件
- ✅ `main.ts` - 引入深色模式样式

#### 重启前端
```bash
# 如果使用的是 vite dev server
# Ctrl+C 停止，然后重新启动
npm run dev

# 如果使用的是生产构建
npm run build
```

---

## 🎨 深色模式使用指南

### 方式一：主题切换按钮

在页面的合适位置添加主题切换按钮：

```vue
<template>
  <a-switch
    :checked="isDark"
    @change="toggleTheme"
    checked-children="🌙"
    un-checked-children="☀️"
  />
</template>

<script setup>
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggleTheme } = useDarkMode()
</script>
```

### 方式二：菜单切换

在用户菜单中添加主题切换选项：

```vue
<template>
  <a-dropdown>
    <a-button>主题</a-button>
    <template #overlay>
      <a-menu @click="handleThemeChange">
        <a-menu-item key="light">
          <span>☀️ 浅色主题</span>
        </a-menu-item>
        <a-menu-item key="dark">
          <span>🌙 深色主题</span>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup>
import { useDarkMode } from '@/composables/useDarkMode'

const { setTheme } = useDarkMode()

const handleThemeChange = ({ key }) => {
  setTheme(key)
}
</script>
```

---

## 📊 组件 Token 分类详情

### Button 组件（18 个 Token）

| Token | 说明 | 浅色模式 | 深色模式 |
|-------|------|---------|---------|
| colorPrimary | 主色 | #F95914 | #FF6A3D |
| colorPrimaryHover | 悬停色 | #FF7043 | #FF8A5C |
| colorPrimaryActive | 按下色 | #E64A19 | #FF4D20 |
| controlHeight | 高度 | 40px | 40px |
| borderRadius | 圆角 | 6px | 6px |
| fontSize | 字号 | 14px | 14px |

### Input 组件（16 个 Token）

| Token | 说明 | 浅色模式 | 深色模式 |
|-------|------|---------|---------|
| colorBgContainer | 背景色 | #ffffff | #1f1f1f |
| colorBorder | 边框色 | #d9d9d9 | #434343 |
| colorText | 文字色 | rgba(0,0,0,0.88) | rgba(255,255,255,0.88) |
| controlHeight | 高度 | 40px | 40px |

### Table 组件（18 个 Token）

| Token | 说明 | 浅色模式 | 深色模式 |
|-------|------|---------|---------|
| headerBg | 表头背景 | #fafafa | #1f1f1f |
| headerColor | 表头文字 | rgba(0,0,0,0.88) | rgba(255,255,255,0.88) |
| rowHoverBg | 行悬停 | #fafafa | #262626 |
| rowSelectedBg | 行选中 | #E6F4FF | #1f3a5f |

### Form 组件（12 个 Token）

| Token | 说明 | 浅色模式 | 深色模式 |
|-------|------|---------|---------|
| labelColor | 标签色 | rgba(0,0,0,0.88) | rgba(255,255,255,0.88) |
| labelErrorColor | 错误色 | #ff4d4f | #ff4d4f |
| colorBgComponent | 背景色 | #ffffff | #1f1f1f |

### Modal 组件（10 个 Token）

| Token | 说明 | 浅色模式 | 深色模式 |
|-------|------|---------|---------|
| colorBgElevated | 背景色 | #ffffff | #1f1f1f |
| colorText | 标题色 | rgba(0,0,0,0.88) | rgba(255,255,255,0.88) |
| borderRadiusLG | 圆角 | 16px | 16px |
| boxShadow | 阴影 | - | - |

### Card 组件（10 个 Token）

| Token | 说明 | 浅色模式 | 深色模式 |
|-------|------|---------|---------|
| colorBgContainer | 背景色 | #ffffff | #1f1f1f |
| colorText | 标题色 | rgba(0,0,0,0.88) | rgba(255,255,255,0.88) |
| borderRadiusLG | 圆角 | 12px | 12px |
| boxShadow | 阴影 | - | - |

---

## 🧪 测试验证

### 1. 主题切换测试

```bash
# 测试浅色主题
curl -X GET http://localhost:8080/api/theme/current

# 预期返回：
# {"code":200,"data":"light","message":"success"}

# 测试切换到深色主题
curl -X POST http://localhost:8080/api/theme/switch \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark"}'

# 预期返回：
# {"code":200,"data":"主题切换成功","message":"success"}
```

### 2. 前端测试

1. 访问任意页面
2. 点击主题切换按钮
3. 验证以下组件是否正确切换：

| 组件 | 浅色模式 | 深色模式 |
|-----|---------|---------|
| 页面背景 | #F5F5F5 | #000000 |
| 卡片背景 | #ffffff | #1f1f1f |
| 按钮颜色 | #F95914 | #FF6A3D |
| 文字颜色 | #000000E6 | #FFFFFFE6 |
| 边框颜色 | #d9d9d9 | #434343 |

### 3. 深色模式效果检查

打开浏览器开发者工具，检查以下内容：

```javascript
// 检查 HTML 属性
document.documentElement.getAttribute('data-theme')
// 浅色模式应该返回：'light'
// 深色模式应该返回：'dark'

// 检查 CSS 变量
getComputedStyle(document.documentElement).getPropertyValue('--primary-color')
// 应该返回对应主题的主色

// 检查类名
document.documentElement.classList.contains('dark-theme')
// 深色模式应该返回 true
```

---

## ⚠️ 注意事项

### 1. CSS 优先级

深色模式的样式通过 `[data-theme="dark"]` 选择器应用，确保：
- 深色模式样式优先级高于浅色模式
- 组件样式能够正确覆盖全局样式

### 2. 组件兼容性

以下组件在深色模式下可能需要额外适配：
- ❌ 自定义组件（需要手动添加深色模式样式）
- ❌ 第三方组件库（如有）
- ❌ Canvas/WebGL 组件

### 3. 性能考虑

主题切换时会：
- 更新约 20+ 个 CSS 变量
- 重新渲染页面样式
- 首次切换可能有轻微闪烁（建议添加 loading 状态）

### 4. 浏览器兼容性

深色模式依赖 CSS 变量，确保目标浏览器支持：
- ✅ Chrome/Edge 61+
- ✅ Firefox 49+
- ✅ Safari 10.1+
- ❌ IE 11（不支持）

---

## 🔧 自定义深色模式

### 修改深色模式颜色

编辑 `useDarkMode.ts` 中的 `DEFAULT_COLORS.dark`：

```typescript
const DEFAULT_COLORS: ThemeColors = {
  dark: {
    primary: '#FF6A3D',    // 修改主色
    primaryHover: '#FF8A5C',
    success: '#73D13D',
    warning: '#FFC53D',
    error: '#FF7875',
    info: '#69C0FF',
    text: '#FFFFFFE6',
    textSecondary: '#FFFFFFB3',
    border: '#434343',
    bgContainer: '#1F1F1F',
    bgLayout: '#000000',
    bgElevated: '#262626',
  },
}
```

### 添加更多组件的深色模式

编辑 `dark-mode.scss`，为自定义组件添加深色样式：

```scss
[data-theme="dark"] {
  .my-custom-component {
    background: var(--color-bg-container);
    color: var(--color-text);
    border-color: var(--color-border);
  }
}
```

---

## 📞 常见问题

### Q1: 主题切换后部分组件没有变化？
A: 检查以下两点：
1. 组件是否使用了 CSS 变量（`var(--xxx)`）
2. 组件样式选择器优先级是否足够

### Q2: 主题切换有闪烁？
A: 这是正常的，可以在 `index.html` 中添加主题脚本：

```html
<script>
  const theme = localStorage.getItem('theme-mode') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
</script>
```

### Q3: 深色模式下图标颜色不对？
A: 为图标添加颜色变量：

```scss
[data-theme="dark"] {
  .icon {
    color: var(--color-text);
    fill: var(--color-text);
  }
}
```

### Q4: 如何强制使用深色模式？
A: 修改 `useDarkMode.ts` 中的 `init()` 函数：

```typescript
function init() {
  // 强制使用深色模式
  setTheme('dark')
}
```

---

## 🎯 下一步计划

第三阶段可以考虑：
- 组件 Token 的在线编辑功能
- 更多组件的 Token 支持（Menu、Dropdown、Tree 等）
- 主题包导出功能
- 与 Design Token 编辑器的集成

---

## 📚 相关文档

- [第一阶段部署说明](./DESIGN_TOKEN_MIGRATION_README.md)
- [Design Token API](./API.md)
- [前端样式规范](../frontend/STYLE_GUIDE.md)
