# antd 原生组件与公司组件混用

> Last updated: 2026-10-10

## 事故经过

2026-10-10 页面生成器「建表脚本抽屉」验收时，用户在 DOM 里发现表格用的是 antd 原生组件
（`ant-table-wrapper` 等 class），而不是公司组件 CompanyTable。同文件里按钮用了
CompanyButton、表格却用 antd Table，混用。

## 根因

1. **Company 组件 = antd 组件 + 公司皮肤**，API 完全兼容，混用不报错、功能正常，错误不显眼
2. 抽屉/弹窗类界面没有 SmartListTemplate 这样的现成模板，「自己拼装」时没有约束就顺手从 antd 拿
3. 周边存量代码（向导/编辑器）本来就用 antd 原生，新代码「顺着邻居风格」写会延续混用

## 预防机制（已落地）

`react-system/eslint.config.js` 加了 `no-restricted-imports` 规则：

- 禁止从 `antd` / `antd/**` 直接导入公司库已封装的组件名（Button/Table/Drawer/Modal/Tag/Space/Typography 等 60+ 个）
- 违规报 **error**，提示改用 CompanyXxx
- **类型导入不受影响**：`import type { TableProps } from 'antd'` 是合法的（公司库类型就是从 antd 转发的）
- `App` / `ConfigProvider` 未列入禁运（提供上下文，暂无替代验证）
- 37 个存量文件（多为向导/编辑器、旧列表页）进了豁免名单降级为 **warn**，迁移一个删一行；新建文件一律 error

## 教训

- 「不报错」≠「符合规范」——UI 组件替换类错误只能靠静态检查拦截，不能靠运行时验证
- 新增 UI 时先查 `@donglegeyu/company-ui` basic-components 是否已有封装，有则必须用 Company 版
- 新写代码不要「顺着邻居风格」，邻居可能就是错的
