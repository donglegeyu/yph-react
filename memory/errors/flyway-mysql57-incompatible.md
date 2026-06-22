# Flyway 与 MySQL 版本兼容性（已踩坑）

> Last updated: 2026-06-22

## 决策

**服务器 MySQL 5.7、Spring Boot 3.2.5、Flyway 三者存在"版本三角"死锁，无法通过单一改 Flyway 版本解决，必须用手动配置类绕开。**

## 版本三角死锁

| 项 | 要求 |
|----|------|
| Spring Boot 3.2.5 的 FlywayAutoConfiguration | 调用 Flyway 9.x 才有的 `placeholderSeparator` 方法 → 必须 Flyway 9.x |
| Flyway 8.0+ 社区版 | 不再支持 MySQL 5.7（抛 FlywayEditionUpgradeRequiredException） |
| Flyway 7.15.0 社区版 | 支持 MySQL 5.7，但缺 9.x 的方法 |

**结论**：任何单一 Flyway 版本都无法同时满足 Spring Boot 3.2.5 + MySQL 5.7。

## 本项目解决方案

### 1. pom.xml 锁定 Flyway 7.15.0

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

移除了 `flyway-mysql`（7.x 不需要，8.2.0 之后才拆出来）。

### 2. 主启动类排除 Spring Boot 的 FlywayAutoConfiguration

```java
@SpringBootApplication(exclude = { FlywayAutoConfiguration.class })
public class MaterialSystemApplication { ... }
```

### 3. 写自定义配置类手动初始化 Flyway

[config/FlywayConfig.java](file:///Users/xiongdongying/ai_project/yph-react/material-system-server/src/main/java/com/material/server/config/FlywayConfig.java)：在 `@PostConstruct` 阶段读取 `spring.flyway.*` 和 `spring.datasource.*` 配置，手动调用 `Flyway.configure()...migrate()`。

这样既避开了 Spring Boot 对 9.x API 的调用，又用了支持 MySQL 5.7 的 7.15.0 版本。

## Flyway 7.15.0 API 已验证签名

- `baselineVersion(String)` ✅
- `baselineOnMigrate(boolean)` ✅
- `validateOnMigrate(boolean)` ✅
- `outOfOrder(boolean)` ✅
- `encoding(Charset)` 和 `encoding(String)` 都 ✅
- `locations(String...)` ✅
- `table(String)` ✅
- `dataSource(String, String, String)` ✅

## 教训

- 本地用 MySQL 8.0 测试通过 ≠ 服务器 MySQL 5.7 能跑
- Spring Boot 父 pom 对第三方库版本有强约束，降级时要看 Spring Boot 源码调用了哪些 API
- 版本兼容性死锁的典型解法：绕过 Spring Boot 的自动配置，手动写配置类接管
