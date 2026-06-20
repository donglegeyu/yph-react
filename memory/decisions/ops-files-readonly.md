# 运维文件不可改动（红线）

> Last updated: 2026-06-20

## 决策

**运维负责维护的 Dockerfile 和 application.yml 是部署红线，任何情况下都不要改动它们，否则线上服务器跑不起来。**

## 涉及文件（不可改）

| 文件 | 路径 | 说明 |
|------|------|------|
| 后端 Dockerfile | [material-system-server/Dockerfile](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/Dockerfile) | 运维维护，包含公司镜像仓库、CI/CD 配置 |
| 后端配置 | [material-system-server/src/main/resources/application.yml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/resources/application.yml) | 运维维护，包含生产环境变量配置 |
| 前端 Dockerfile | [react-system/Dockerfile](file:///Users/xiongdongying/ai_project/yph-react/react-system/Dockerfile) | 运维维护 |
| 前端 Nginx 配置 | [react-system/nginx.conf](file:///Users/xiongdongying/ai_project/yph-react/react-system/nginx.conf) | 运维维护 |

## 原因

- 这些文件由运维根据服务器环境（公司私有镜像仓库、CI/CD 流水线、生产环境变量等）定制
- 改动后会导致线上部署失败、服务起不来
- 历史事故：AI 曾覆盖过运维的 Dockerfile，导致 CI/CD 构建失败

## 处理方式

- 如需修改这些文件，必须由运维操作
- AI（Claude/任何助手）遇到这些文件，**只读不写**
- 如必须改动，先与运维沟通，由运维修改并提交
