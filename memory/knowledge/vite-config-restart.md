# 改 vite.config.ts 后必须重启 Vite

> Last updated: 2026-11-12

## 现象

长跑的 Vite dev 进程**不会加载修改后的 vite.config.ts**（尤其 proxy 规则），导致请求被代理到错误后端。

## 事故复盘（2026-11-12）

- vite.config.ts 增加了 `/api/approval → http://localhost:8082` 代理规则（放在 `/api → 8081` 之前，规则本身正确）
- 但 Vite 进程是**改配置之前**启动的（11/11 启动，配置 11/12 修改），旧进程仍按旧规则把 `/api/approval` 打到 8081 material 后端
- 返回 `{"code":500,"message":"服务器内部错误"}` —— 这是 8081 GlobalExceptionHandler 专属文案，可作**指纹**判断请求走错后端
- curl 直连 8082 正常、走 3001 代理 500，即可确认是代理问题

## 排查方法

```bash
# 直连目标后端 vs 过代理，对比结果
curl -s http://localhost:8082/api/approval/xxx -H "Authorization: Bearer <token>"
curl -s http://localhost:3001/api/approval/xxx -H "Authorization: Bearer <token>"

# 查看 Vite 进程启动时间 vs vite.config.ts 修改时间
ps -p <pid> -o lstart
```

## 修复

先 kill 旧进程再重启（不要并发两个 Vite，端口冲突）：

```bash
kill $(lsof -ti:3001)
cd react-system && npx vite --host 0.0.0.0 --port 3001  # 后台运行
```
