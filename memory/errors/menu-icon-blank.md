# 菜单图标空白：icon 名不在映射表

> Last updated: 2026-11-16

## 现象

新增菜单后，二级侧边栏/一级侧边栏/更多菜单里该菜单的图标显示为空白，其余文字正常。历史上已发生多次（如 V38 业务流程配置用 `apartment`）。

## 根因

- `nav_menu.icon` 存的是 antd 风格图标名（如 `apartment`、`clipboard`）
- 前端实际图标来自 `/iconpark/sprite_nav.svg`（symbol id 如 `building-one`、`table`）
- 两侧命名不一致，靠 `MENU_ICON_MAP`（react-system/src/constants/menuIconMap.ts）翻译
- **图标名不在映射表 → 原样传给 `<use href="#xxx">` → sprite 无此 symbol → 空白**

## 修复历史（2026-11-16）

原先映射表在 5 个文件各复制一份（FirstSidebar / SecondSidebar / MoreMenuDrawer / CustomNavPanel / MenuManagement），每加新菜单要同步 5 处，漏一处就空白。已重构为共享模块 [menuIconMap.ts](../../../react-system/src/constants/menuIconMap.ts)，5 个组件统一 `import { getMenuIconName } from '@/constants/menuIconMap'`。

## 规矩（以后就这么干）

1. **新增菜单 SQL 配图标前，先查 [menuIconMap.ts](file:///Users/xiongdongying/ai_project/yph-react/react-system/src/constants/menuIconMap.ts)**：要么用映射表已有的键名，要么先补映射再写 SQL
2. 可用 sprite id 一览：`grep -o 'id="[^"]*"' react-system/public/iconpark/sprite_nav.svg`
3. 校验数据库现有图标是否全部可解析：
   ```bash
   docker exec material-mysql-react mysql -uroot -proot123456 material_system_react -N -B \
     -e "SELECT DISTINCT icon FROM nav_menu WHERE deleted=0 AND icon IS NOT NULL AND icon<>''" | sort
   ```
   逐个对照 `MENU_ICON_MAP`（未命中的会空白）
4. 菜单管理页面（MenuManagement）的 IconSelect 只提供 sprite id；SQL 里若写 antd 名必须进映射表
