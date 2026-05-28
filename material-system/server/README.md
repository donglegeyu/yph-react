# 图标配置服务

## 启动服务

```bash
cd server
npm install
npm start
```

服务端口：8081

## API 接口

### GET /api/icons
获取图标配置

响应：
```json
{
  "code": 200,
  "data": {
    "preset": [...],
    "custom": [...]
  }
}
```

### PUT /api/icons
保存图标配置

请求：
```json
{
  "preset": [...],
  "custom": [...]
}
```

响应：
```json
{
  "code": 200,
  "message": "保存成功"
}
```

## 数据存储

图标配置保存在 `data/icons.json` 文件中。
