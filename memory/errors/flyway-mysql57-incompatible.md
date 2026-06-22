# Flyway 与 MySQL 版本兼容性（已踩坑）

> Last updated: 2026-06-22

## 决策

**Flyway 社区版从 8.0 开始不再支持 MySQL 5.7。本地开发用 MySQL 8.0 跑得好好的，部署到服务器（MySQL 5.7）会直接启动失败。**

## 兼容版本对照

| MySQL 版本 | 支持的 Flyway 社区版最后一个版本 |
|-----------|-----------------------------|
| 5.7       | **7.15.0**（再新就不支持）     |
| 8.0+      | 9.x（当前最新）              |

## 错误现象（服务器日志）

```
Flyway Teams Edition or MySQL upgrade required: 
MySQL 5.7 is no longer supported by Flyway Community Edition, 
but still supported by Flyway Teams Edition.
```

## 本项目解决方案

在 [material-system-server/pom.xml](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/pom.xml) 的 properties 显式锁定 Flyway 版本：

```xml
<properties>
    <flyway.version>7.15.0</flyway.version>
</properties>

<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
    <version>${flyway.version}</version>
</dependency>
```

同时移除了 `flyway-mysql` 依赖（那是 8.2.0 之后才从 flyway-core 拆出来的，7.x 不需要）。

## 教训

- 加 Flyway 之前必须确认服务器 MySQL 版本，不能只看本地
- 本地用 Docker MySQL 8.0 测试通过 ≠ 服务器也能跑
- pom.xml 中版本类依赖最好显式锁定，不要依赖父 pom 的版本管理
