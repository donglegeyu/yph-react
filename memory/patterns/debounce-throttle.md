# 防抖节流模式

> Last updated: 2026-06-16

## 场景

搜索输入、按钮防重复点击、窗口 resize

## 防抖 (Debounce)

### 使用

```typescript
const debouncedSearch = debounce((query: string) => {
  console.log('Searching:', query)
}, 300)
```

## 节流 (Throttle)

### 使用

```typescript
const throttledResize = throttle(() => {
  console.log('Window resized')
}, 200)
```

## 场景选择

| 场景 | 推荐 |
|------|------|
| 搜索输入 | 防抖 |
| 按钮提交 | 节流 |
| 窗口 resize | 节流 |
