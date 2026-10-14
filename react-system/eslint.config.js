import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ============================================================
// 公司组件强制规则：
// company-ui 已对下列 antd 组件做了封装（CompanyXxx，主题样式统一），
// 业务代码禁止直接从 antd 导入这些组件名，必须使用公司组件。
// 类型导入（import type { TableProps } from 'antd'）不受影响。
// ============================================================
const COMPANY_WRAPPED_ANTD_COMPONENTS = [
  'Affix', 'Alert', 'Anchor', 'AutoComplete', 'Avatar', 'Badge', 'Breadcrumb',
  'Button', 'Calendar', 'Card', 'Carousel', 'Cascader', 'Checkbox', 'Col',
  'Collapse', 'ColorPicker', 'Descriptions', 'Divider', 'Drawer', 'Dropdown',
  'Empty', 'Flex', 'FloatButton', 'Form', 'Image', 'Input', 'InputNumber',
  'Layout', 'List', 'Mentions', 'Menu', 'Message', 'Modal', 'Notification',
  'Pagination', 'Popconfirm', 'Popover', 'Progress', 'QRCode', 'Radio', 'Rate',
  'Result', 'Row', 'Segmented', 'Select', 'Skeleton', 'Slider', 'Space', 'Spin',
  'Splitter', 'Statistic', 'Steps', 'Switch', 'Table', 'Tabs', 'Tag', 'Timeline',
  'TimePicker', 'Tooltip', 'Tour', 'Transfer', 'Tree', 'TreeSelect', 'Typography',
  'Upload', 'Watermark',
]

const antdCompanyUiImportRule = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['antd', 'antd/**'],
          importNames: COMPANY_WRAPPED_ANTD_COMPONENTS,
          message:
            '该组件 company-ui 已有封装，请使用 @donglegeyu/company-ui 的 CompanyXxx，保证主题样式统一。',
        },
      ],
    },
  ],
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: antdCompanyUiImportRule,
  },
  // 存量豁免：以下文件在规则上线（2026-10）前已使用 antd 原生组件（多为向导/编辑器内部表单），
  // 降级为 warn 提醒，后续迁移到公司组件后从列表移除。新建文件一律 error。
  {
    files: [
      // 公共组件
      'src/components/FilterOptionsDrawer.tsx',
      // 列表/物料
      'src/pages/list/MaterialList.tsx',
      // 首页
      'src/pages/home/SalesDashboard.tsx',
      // 表单
      'src/pages/form/DomainForm.tsx',
      // 通用页面
      'src/pages/common/CategoryListView.tsx',
      'src/pages/common/CertManageDrawer.tsx',
      'src/pages/common/CourseManage.tsx',
      'src/pages/common/CoursewareManage.tsx',
      'src/pages/common/CraftsmanApplication.tsx',
      'src/pages/common/CraftsmanApplicationDetail.tsx',
      'src/pages/common/CraftsmanDetail.tsx',
      'src/pages/common/craftsman-detail-shared.tsx',
      'src/pages/common/CraftsmanForm.tsx',
      'src/pages/common/CraftsmanQuery.tsx',
      'src/pages/common/DepartmentManagement.tsx',
      'src/pages/common/DynamicDetailPage.tsx',
      'src/pages/common/DynamicFormPage.tsx',
      'src/pages/common/DynamicListPage.tsx',
      'src/pages/common/MenuManagement.tsx',
      'src/pages/common/PermissionQuery.tsx',
      'src/pages/common/QualityFeedbackList.tsx',
      'src/pages/common/QuestionBankList.tsx',
      'src/pages/common/RoleManagement.tsx',
      'src/pages/common/SecurityCheckQuery.tsx',
      'src/pages/common/SkillDrawer.tsx',
      'src/pages/common/SkillManagement.tsx',
      'src/pages/common/TagListView.tsx',
      'src/pages/common/TrainingTaskList.tsx',
      'src/pages/common/UserDetail.tsx',
      'src/pages/common/UserManagement.tsx',
      // 页面生成器（向导/编辑器）
      'src/pages/generator/PageGeneratorEdit.tsx',
      'src/pages/generator/PageGeneratorWizard.tsx',
      'src/pages/generator/components/DataSourceEditor.tsx',
      'src/pages/generator/components/FieldEditor.tsx',
      'src/pages/generator/components/OptionsEditor.tsx',
      'src/pages/generator/components/PreviewPanel.tsx',
      'src/pages/generator/components/StatusMapEditor.tsx',
    ],
    rules: { 'no-restricted-imports': 'warn' },
  },
])
