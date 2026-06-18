# 组件库升级后项目未生效

> Last updated: 2026-06-17

## 场景

执行 `npm install @donglegeyu/company-ui@latest` 升级组件库后，`package.json` 和 `node_modules` 里的版本号都已经是新版本，但浏览器里看到的组件样式/行为还是旧版本。

## 问题现象

- `package.json` 显示新版本 ✅
- `node_modules/@donglegeyu/company-ui/package.json` 显示新版本 ✅
- 直接 Read `node_modules/.../index.scss` 内容是新版本 ✅
- 但浏览器渲染的组件还是旧样式 ❌

## 根因：Vite 依赖预构建缓存

Vite 启动时会扫描 `optimizeDeps.entries`，把 `node_modules` 中的 CommonJS/UMD 依赖预构建成 ESM 格式，缓存到：

```
node_modules/.vite/deps/
├── @donglegeyu_company-ui.js    ← 实际被项目 import 的文件
├── @donglegeyu_company-ui.css
└── _metadata.json               ← 缓存哈希指纹
```

**关键点**：这个缓存**不会因为 `npm install` 而自动失效**。Vite 通过 `_metadata.json` 里的 lockfile 哈希 + pinia 配置判断是否需要重建，如果 lockfile 哈希没变（即便 package.json 版本变了但 lockfile 没更新），就会继续用旧缓存。

## 标准修复流程

### 方案 1：强制清理缓存 + 重启（推荐）

```bash
# 1. 杀掉占用端口的旧 Vite 进程
lsof -ti:3001 | xargs kill -9 2>/dev/null

# 2. 清理 Vite 预构建缓存
rm -rf node_modules/.vite

# 3. 用 --force 重启（强制重新预构建依赖）
npx vite --host 0.0.0.0 --port 3001 --force
```

### 方案 2：只重启加 --force

```bash
# 杀进程后直接 --force 启动（Vite 会自动清理旧缓存）
lsof -ti:3001 | xargs kill -9 2>/dev/null
npx vite --host 0.0.0.0 --port 3001 --force
```

### 方案 3：浏览器强制刷新

清理缓存重启 Vite 后，浏览器还需要：
- `Cmd + Shift + R`（macOS）强制刷新，绕过浏览器 HTTP 缓存
- 或打开 DevTools → Network → 勾选 "Disable cache"

## 验证缓存是否生效

```bash
# 检查 .vite/deps 是否被重建（修改时间应为刚刚）
ls -la node_modules/.vite/deps/ | head

# 检查 _metadata.json 的哈希
cat node_modules/.vite/deps/_metadata.json | grep hash
```

## 升级组件库的完整 Checklist

```bash
# 1. 查看当前版本
cat node_modules/@donglegeyu/company-ui/package.json | grep version

# 2. 查看最新版本
npm view @donglegeyu/company-ui version

# 3. 升级
npm install @donglegeyu/company-ui@latest

# 4. 验证 node_modules 版本已更新
cat node_modules/@donglegeyu/company-ui/package.json | grep version

# 5. ⚠️ 关键：清理 Vite 缓存并强制重启
lsof -ti:3001 | xargs kill -9 2>/dev/null
rm -rf node_modules/.vite
npx vite --host 0.0.0.0 --port 3001 --force

# 6. 浏览器强制刷新 (Cmd+Shift+R)
```

## 容易踩的坑

1. **只执行 npm install 就以为生效了** → 必须清理 Vite 缓存
2. **只清理缓存不杀进程** → 旧 Vite 进程会重新生成旧缓存
3. **只重启不用 --force** → Vite 可能判断不需要重建缓存
4. **忘记浏览器强制刷新** → Vite 已更新但浏览器加载的是 HTTP 缓存

## 相关

- 本项目组件库：`@donglegeyu/company-ui`
- Vite 配置：[react-system/vite.config.ts](file:///Users/xiongdongying/ai_project/yph-react/react-system/vite.config.ts)
- 本文档适用场景：任何 `node_modules` 中的依赖升级后（含 antd、axios 等）
