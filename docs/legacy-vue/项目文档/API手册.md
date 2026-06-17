# 材料申请管理系统 - API 接口手册

> 版本: v1.0 | 日期: 2026-04-15

## 目录

- [接口概览](#1-接口概览)
- [通用说明](#2-通用说明)
- [材料申请接口](#3-材料申请接口)
- [导航菜单接口](#4-导航菜单接口)
- [收藏接口](#5-收藏接口)
- [采购订单接口](#6-采购订单接口)
- [用户偏好接口](#7-用户偏好接口)
- [错误码说明](#8-错误码说明)

---

## 1. 接口概览

### 1.1 接口统计

| 模块 | 接口数 | 主要功能 |
|------|--------|----------|
| 材料申请 | 5 | 材料的 CRUD 操作 |
| 导航菜单 | 7 | 菜单的增删改查和批量操作 |
| 收藏 | 4 | 收藏的增删改查 |
| 采购订单 | 1 | 订单列表查询 |
| 用户偏好 | 2 | 用户偏好设置 |
| **总计** | **19** | - |

### 1.2 接口域名

- 开发环境: `http://localhost:8080`
- 生产环境: `https://api.material-system.com` (示例)

---

## 2. 通用说明

### 2.1 请求格式

所有接口支持以下请求格式：

- **Content-Type**: `application/json`
- **字符编码**: UTF-8

### 2.2 认证方式

接口使用 JWT Token 认证，在请求头中携带 Token：

```
Authorization: Bearer <token>
```

### 2.3 响应格式

所有接口返回统一的 JSON 格式：

#### 成功响应

```json
{
  "code": 200,
  "data": { ... },
  "message": "操作成功"
}
```

#### 错误响应

```json
{
  "code": 400,
  "data": null,
  "message": "参数错误"
}
```

#### 分页响应

```json
{
  "code": 200,
  "data": [ ... ],
  "total": 100,
  "current": 1,
  "size": 20
}
```

### 2.4 时间格式

- 日期时间格式: `yyyy-MM-dd HH:mm:ss`
- 日期格式: `yyyy-MM-dd`
- 时间戳格式: Unix 时间戳（秒）

---

## 3. 材料申请接口

### 3.1 查询材料申请列表

**接口地址**: `GET /api/materials`

**请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| current | Integer | 否 | 1 | 当前页码 |
| size | Integer | 否 | 20 | 每页条数 |
| materialName | String | 否 | - | 材料名称（模糊查询） |
| applicant | String | 否 | - | 申请人（精确查询） |
| status | String | 否 | - | 状态 |
| department | String | 否 | - | 部门 |

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/materials?current=1&size=20&materialName=钢材"
```

**响应示例**:

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "applicationNo": "APP2024010001",
      "materialName": "螺纹钢筋",
      "spec": "HRB400 Φ16",
      "unit": "吨",
      "quantity": 50.0000,
      "department": "工程部",
      "supplier": "某某钢材公司",
      "description": "项目施工用钢材",
      "status": "pending",
      "applicant": "张三",
      "applyTime": "2024-01-15 10:30:00",
      "createTime": "2024-01-15 10:30:00",
      "updateTime": "2024-01-15 10:30:00"
    }
  ],
  "total": 100
}
```

### 3.2 查询材料申请详情

**接口地址**: `GET /api/materials/{id}`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 材料申请ID |

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/materials/1"
```

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "applicationNo": "APP2024010001",
    "materialName": "螺纹钢筋",
    "spec": "HRB400 Φ16",
    "unit": "吨",
    "quantity": 50.0000,
    "department": "工程部",
    "supplier": "某某钢材公司",
    "description": "项目施工用钢材",
    "status": "pending",
    "applicant": "张三",
    "applyTime": "2024-01-15 10:30:00",
    "createTime": "2024-01-15 10:30:00",
    "updateTime": "2024-01-15 10:30:00"
  }
}
```

### 3.3 创建材料申请

**接口地址**: `POST /api/materials`

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| applicationNo | String | 是 | 申请单号 |
| materialName | String | 是 | 材料名称 |
| spec | String | 否 | 规格型号 |
| unit | String | 否 | 单位 |
| quantity | BigDecimal | 否 | 申请数量 |
| department | String | 否 | 部门 |
| supplier | String | 否 | 供应商 |
| description | String | 否 | 描述 |
| status | String | 否 | 状态 |
| applicant | String | 否 | 申请人 |
| applyTime | LocalDateTime | 否 | 申请时间 |

**请求示例**:

```bash
curl -X POST "http://localhost:8080/api/materials" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationNo": "APP2024010002",
    "materialName": "水泥",
    "spec": "P.O 42.5",
    "unit": "吨",
    "quantity": 100.0000,
    "department": "工程部",
    "supplier": "某某水泥厂",
    "description": "项目施工用水泥",
    "status": "draft",
    "applicant": "李四"
  }'
```

**响应示例**:

```json
{
  "code": 200,
  "data": 2
}
```

### 3.4 更新材料申请

**接口地址**: `PUT /api/materials/{id}`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 材料申请ID |

**请求体**: 同创建接口

**请求示例**:

```bash
curl -X PUT "http://localhost:8080/api/materials/2" \
  -H "Content-Type: application/json" \
  -d '{
    "materialName": "水泥（已更新）",
    "quantity": 150.0000
  }'
```

**响应示例**:

```json
{
  "code": 200
}
```

### 3.5 删除材料申请

**接口地址**: `DELETE /api/materials/{id}`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 材料申请ID |

**请求示例**:

```bash
curl -X DELETE "http://localhost:8080/api/materials/2"
```

**响应示例**:

```json
{
  "code": 200
}
```

---

## 4. 导航菜单接口

### 4.1 获取菜单树

**接口地址**: `GET /api/nav-menus`

**请求参数**: 无

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/nav-menus"
```

**响应示例**:

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "key": "home",
      "label": "首页",
      "path": "/home",
      "icon": "home",
      "sort": 0,
      "status": 1,
      "parentId": 0,
      "menuType": "系统菜单-上",
      "createTime": "2024-01-01 00:00:00",
      "updateTime": "2024-01-01 00:00:00",
      "children": []
    },
    {
      "id": 2,
      "key": "material",
      "label": "材料管理",
      "path": null,
      "icon": "folder-open",
      "sort": 1,
      "status": 1,
      "parentId": 0,
      "menuType": "业务菜单",
      "createTime": "2024-01-01 00:00:00",
      "updateTime": "2024-01-01 00:00:00",
      "children": [
        {
          "id": 3,
          "key": "material-list",
          "label": "材料列表",
          "path": "/materials",
          "icon": "list",
          "sort": 0,
          "status": 1,
          "parentId": 2,
          "menuType": "业务菜单",
          "children": []
        }
      ]
    }
  ]
}
```

### 4.2 获取菜单详情

**接口地址**: `GET /api/nav-menus/{id}`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 菜单ID |

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/nav-menus/1"
```

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "key": "home",
    "label": "首页",
    "path": "/home",
    "icon": "home",
    "sort": 0,
    "status": 1,
    "parentId": 0,
    "menuType": "系统菜单-上",
    "createTime": "2024-01-01 00:00:00",
    "updateTime": "2024-01-01 00:00:00"
  }
}
```

### 4.3 创建菜单

**接口地址**: `POST /api/nav-menus`

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | String | 是 | 菜单标识 |
| label | String | 是 | 菜单名称 |
| path | String | 否 | 路由路径 |
| icon | String | 否 | 图标 |
| sort | Integer | 否 | 排序 |
| status | Integer | 否 | 状态（0-禁用，1-启用） |
| parentId | Long | 否 | 父菜单ID |
| menuType | String | 否 | 菜单类型 |

**请求示例**:

```bash
curl -X POST "http://localhost:8080/api/nav-menus" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "new-menu",
    "label": "新菜单",
    "path": "/new-menu",
    "icon": "folder",
    "sort": 10,
    "status": 1,
    "parentId": 0,
    "menuType": "业务菜单"
  }'
```

**响应示例**:

```json
{
  "code": 200,
  "data": 10
}
```

### 4.4 更新菜单

**接口地址**: `PUT /api/nav-menus/{id}`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 菜单ID |

**请求体**: 同创建接口

**请求示例**:

```bash
curl -X PUT "http://localhost:8080/api/nav-menus/10" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "新菜单（已更新）",
    "sort": 5
  }'
```

**响应示例**:

```json
{
  "code": 200
}
```

### 4.5 删除菜单

**接口地址**: `DELETE /api/nav-menus/{id}`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 菜单ID |

**请求示例**:

```bash
curl -X DELETE "http://localhost:8080/api/nav-menus/10"
```

**响应示例**:

```json
{
  "code": 200
}
```

### 4.6 批量更新菜单状态

**接口地址**: `PUT /api/nav-menus/batch-status`

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | List<Long> | 是 | 菜单ID列表 |
| status | Integer | 是 | 状态（0-禁用，1-启用） |

**请求示例**:

```bash
curl -X PUT "http://localhost:8080/api/nav-menus/batch-status" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [1, 2, 3],
    "status": 0
  }'
```

**响应示例**:

```json
{
  "code": 200
}
```

### 4.7 批量删除菜单

**接口地址**: `POST /api/nav-menus/batch`

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | List<Long> | 是 | 菜单ID列表 |

**请求示例**:

```bash
curl -X POST "http://localhost:8080/api/nav-menus/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [4, 5, 6]
  }'
```

**响应示例**:

```json
{
  "code": 200
}
```

### 4.8 获取菜单视图列表

**接口地址**: `GET /api/menu-views`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | String | 否 | 用户ID，默认 user-001 |
| pageType | String | 否 | 页面类型，默认 menu-management |

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/menu-views?userId=user-001&pageType=menu-management"
```

**响应示例**:

```json
{
  "code": 200,
  "data": [
    {
      "id": "1",
      "name": "业务菜单视图",
      "userId": "user-001",
      "createdAt": "2026-04-21T10:00:00",
      "filters": {
        "menuType": "业务菜单"
      },
      "filterOrder": ["menuType"]
    }
  ]
}
```

### 4.9 创建/更新菜单视图

**接口地址**: `POST /api/menu-views`

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 否 | 视图ID，有值则更新，无值则新增 |
| name | String | 是 | 视图名称 |
| filters | Object | 是 | 筛选条件 |
| filterOrder | Array | 是 | 筛选字段顺序 |
| userId | String | 否 | 用户ID |
| pageType | String | 否 | 页面类型 |

**请求示例**:

```bash
curl -X POST "http://localhost:8080/api/menu-views" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "业务菜单视图",
    "filters": {
      "menuType": "业务菜单"
    },
    "filterOrder": ["menuType"]
  }'
```

**响应示例**:

```json
{
  "code": 200,
  "data": "1"
}
```

### 4.10 更新菜单视图

**接口地址**: `PUT /api/menu-views/{id}`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 视图ID |

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 视图名称 |
| filters | Object | 是 | 筛选条件 |
| filterOrder | Array | 是 | 筛选字段顺序 |

**请求示例**:

```bash
curl -X PUT "http://localhost:8080/api/menu-views/1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "业务菜单视图（已更新）",
    "filters": {
      "menuType": "业务菜单"
    },
    "filterOrder": ["menuType"]
  }'
```

**响应示例**:

```json
{
  "code": 200
}
```

### 4.11 删除菜单视图

**接口地址**: `DELETE /api/menu-views/{id}`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 视图ID |

**请求示例**:

```bash
curl -X DELETE "http://localhost:8080/api/menu-views/1"
```

**响应示例**:

```json
{
  "code": 200
}
```

---

## 5. 收藏接口

### 5.1 获取收藏列表

**接口地址**: `GET /api/favorites`

**请求参数**: 无

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/favorites"
```

**响应示例**:

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "menuKey": "material-list",
      "menuLabel": "材料列表",
      "menuPath": "/materials",
      "sort": 0,
      "createTime": "2024-01-10 10:00:00",
      "updateTime": "2024-01-10 10:00:00"
    }
  ]
}
```

### 5.2 添加收藏

**接口地址**: `POST /api/favorites`

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| menuKey | String | 是 | 菜单标识 |
| menuLabel | String | 是 | 菜单名称 |
| menuPath | String | 是 | 菜单路径 |
| sort | Integer | 否 | 排序 |

**请求示例**:

```bash
curl -X POST "http://localhost:8080/api/favorites" \
  -H "Content-Type: application/json" \
  -d '{
    "menuKey": "material-list",
    "menuLabel": "材料列表",
    "menuPath": "/materials",
    "sort": 0
  }'
```

**响应示例**:

```json
{
  "code": 200,
  "data": 2
}
```

### 5.3 移除收藏

**接口地址**: `DELETE /api/favorites/menu/{menuKey}`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| menuKey | String | 是 | 菜单标识 |

**请求示例**:

```bash
curl -X DELETE "http://localhost:8080/api/favorites/menu/material-list"
```

**响应示例**:

```json
{
  "code": 200
}
```

### 5.4 更新收藏排序

**接口地址**: `PUT /api/favorites/sort`

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | List | 是 | 收藏项列表 |

**items 字段结构**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| menuKey | String | 是 | 菜单标识 |
| sort | Integer | 是 | 排序值 |

**请求示例**:

```bash
curl -X PUT "http://localhost:8080/api/favorites/sort" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"menuKey": "menu-1", "sort": 0},
      {"menuKey": "menu-2", "sort": 1},
      {"menuKey": "menu-3", "sort": 2}
    ]
  }'
```

**响应示例**:

```json
{
  "code": 200
}
```

---

## 6. 采购订单接口

### 6.1 查询采购订单列表

**接口地址**: `GET /api/purchase-orders`

**请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| current | Integer | 否 | 1 | 当前页码 |
| size | Integer | 否 | 100 | 每页条数 |
| orderNo | String | 否 | - | 订单号（模糊查询） |
| supplierName | String | 否 | - | 供应商名称（模糊查询） |
| status | String | 否 | - | 状态 |

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/purchase-orders?current=1&size=20&status=pending"
```

**响应示例**:

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "orderNo": "PO2024010001",
      "supplierId": 1,
      "supplierName": "某某供应商",
      "totalAmount": 50000.00,
      "status": "pending",
      "creatorId": 1,
      "createTime": "2024-01-15 14:00:00",
      "updateTime": "2024-01-15 14:00:00"
    }
  ],
  "total": 50
}
```

---

## 7. 用户偏好接口

### 7.1 获取用户偏好

**接口地址**: `GET /api/user-preferences`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| key | String | 否 | 偏好键（不传则返回全部） |

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/user-preferences?key=theme"
```

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "preferenceKey": "theme",
    "preferenceValue": "dark"
  }
}
```

### 7.2 设置用户偏好

**接口地址**: `PUT /api/user-preferences`

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | String | 是 | 偏好键 |
| value | String | 是 | 偏好值 |

**请求示例**:

```bash
curl -X PUT "http://localhost:8080/api/user-preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "theme",
    "value": "dark"
  }'
```

**响应示例**:

```json
{
  "code": 200
}
```

---

## 8. 错误码说明

### 8.1 通用错误码

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 200 | 成功 | - |
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未认证 | 检查 Token 是否有效 |
| 403 | 无权限 | 检查用户权限 |
| 404 | 资源不存在 | 检查资源ID是否正确 |
| 500 | 服务器错误 | 联系技术支持 |

### 8.2 业务错误码

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 1001 | 材料申请不存在 | 检查申请ID |
| 1002 | 菜单不存在 | 检查菜单ID |
| 1003 | 收藏已存在 | 避免重复添加 |
| 1004 | 收藏不存在 | 检查菜单标识 |
| 1005 | 订单不存在 | 检查订单ID |
| 1006 | 状态不允许操作 | 检查当前状态 |
| 1007 | 数据验证失败 | 检查数据格式 |

---

## 附录

### A. 数据类型说明

| 类型 | 说明 | 示例 |
|------|------|------|
| String | 字符串 | "示例文本" |
| Integer | 32位整数 | 1, 100, 999 |
| Long | 64位整数 | 1000000000000 |
| BigDecimal | 精确小数 | 100.50 |
| Boolean | 布尔值 | true, false |
| LocalDateTime | 日期时间 | 2024-01-15 10:30:00 |
| List | 数组 | [1, 2, 3] |
| Object | 对象 | {"key": "value"} |

### B. 状态值说明

| 状态 | 值 | 说明 |
|------|------|------|
| draft | draft | 草稿 |
| pending | pending | 待审批 |
| approved | approved | 已通过 |
| rejected | rejected | 已拒绝 |
| disabled | 0 | 禁用 |
| enabled | 1 | 启用 |

---

*本文档由代码生成器自动生成，最后更新：2026-04-15*
