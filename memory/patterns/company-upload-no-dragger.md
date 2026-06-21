# company-ui 组件缺陷：CompanyUpload 无 Dragger 子组件

> Last updated: 2026-06-21

## 场景

使用 `@donglegeyu/company-ui` 的 `CompanyUpload` 组件实现拖拽上传时，写 `CompanyUpload.Dragger` 会导致页面崩溃：

```
Error: Element type is invalid: expected a string (for built-in components)
or a class/function (for composite components) but got: undefined.
You likely forgot to export your component from the file it's defined in,
or you might have mixed up default and named imports.
Check the render method of `CraftsmanQuery`.
```

## 问题现象

- 页面直接白屏崩溃
- 错误信息指向使用了 `CompanyUpload.Dragger` 的组件
- 浏览器控制台报 "Element type is invalid... got: undefined"

## 根因：组件库缺陷

`CompanyUpload` 是 company-ui 对 antd `Upload` 的简化包装，但**只包装了主组件，没有挂载 `.Dragger` 子组件**。

文件：`node_modules/@donglegeyu/company-ui/dist/es/basic-components/CompanyUpload/index.js`

```js
// 组件库源码（不完整）
export var CompanyUpload = function CompanyUpload(props) {
  return _jsx(ConfigProvider, {
    theme: companyTheme,
    children: _jsx(AntdUpload, _objectSpread({}, props))
  });
};
// ❌ 缺少：CompanyUpload.Dragger = ...
// ❌ 缺少：CompanyUpload.LIST_IGNORE = AntdUpload.LIST_IGNORE（虽然有但容易混淆）
```

对比 antd 原生 Upload：

```js
// antd 原生 Upload 有完整的子组件挂载
Upload.Dragger = Dragger;
Upload.LIST_IGNORE = 'LIST_IGNORE';
```

## 标准修复方案

### 用 antd 原生 Upload.Dragger + ConfigProvider 包裹

```tsx
import { Upload, ConfigProvider } from 'antd'
import { companyTheme } from '@donglegeyu/company-ui'

<ConfigProvider theme={companyTheme}>
  <Upload.Dragger
    accept=".xls,.xlsx"
    maxCount={1}
    fileList={fileList}
    beforeUpload={handleBeforeUpload}
    onChange={handleUploadChange}
  >
    <p className="ant-upload-drag-icon">📄</p>
    <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
    <p className="ant-upload-hint">支持 xls、xlsx 格式，文件大小不超过 5M</p>
  </Upload.Dragger>
</ConfigProvider>
```

### 关键点

1. **必须用 `<ConfigProvider theme={companyTheme}>` 包裹**：因为 Upload.Dragger 在 Drawer/Modal 等 portal 场景下，需要主题 context 才能正确注入样式
2. **`beforeUpload` 返回 `Upload.LIST_IGNORE`** 拒绝不合规文件（不是 `CompanyUpload.LIST_IGNORE`）
3. **Dragger 内部的 `<p>` 必须加 antd 的类名**：`ant-upload-drag-icon`、`ant-upload-text`、`ant-upload-hint`，否则文字不显示

## antd Upload.Dragger 内部 children 的类名要求

antd 的 Dragger 内部只识别三个固定类名的元素，其他自定义 `<p>` 会被样式压缩/隐藏：

| 类名 | 作用 | 必需 |
|------|------|------|
| `.ant-upload-drag-icon` | 图标区 | 是 |
| `.ant-upload-text` | 主标题 | 是 |
| `.ant-upload-hint` | 提示文字 | 是（多行提示时） |

```tsx
// ✅ 正确：文字会显示
<p className="ant-upload-drag-icon">📄</p>
<p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
<p className="ant-upload-hint">支持单次上传，上传内容后需清空再继续上传</p>

// ❌ 错误：第三行提示会被 antd 内部 flex 布局隐藏
<p>📄</p>
<p>点击或拖拽文件到此区域上传</p>
<p>支持单次上传，上传内容后需清空再继续上传</p>
```

## 待推动组件库维护者补全

在 `CompanyUpload` 的源码中补充：

```js
import { Upload as AntdUpload } from 'antd';

export var CompanyUpload = function CompanyUpload(props) { ... };

// 需要补充这两行
CompanyUpload.Dragger = function CompanyUploadDragger(props) {
  return _jsx(ConfigProvider, {
    theme: companyTheme,
    children: _jsx(AntdUpload.Dragger, _objectSpread({}, props))
  });
};
CompanyUpload.LIST_IGNORE = AntdUpload.LIST_IGNORE;
```

补全后项目内可直接用 `CompanyUpload.Dragger`，无需手动包 ConfigProvider。

## 相关

- company-ui 组件库路径：`node_modules/@donglegeyu/company-ui/dist/es/basic-components/CompanyUpload/`
- antd Upload 文档：https://ant.design/components/upload
- 项目内使用案例：[CraftsmanQuery.tsx 导入抽屉](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/pages/common/CraftsmanQuery.tsx)
