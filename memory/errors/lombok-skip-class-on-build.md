# Lombok 在本机构建时随机跳类（已彻底去 Lombok）

> Last updated: 2026-11-11

## 现象

approval-server（Spring Boot 3.5.16 + JDK 24/26）本机 `mvn package` 时，Lombok 注解处理**随机跳过恰好一个类**：

- 第一次：AuthInterceptor 的 `@RequiredArgsConstructor` 未生效（"变量 jwtVerifier 未在默认构造器中初始化"）+ ProcessDefinitionInitializer 的 `@Slf4j` 未生效（"找不到符号 log"）
- 手写构造器修掉 AuthInterceptor 后 → 错误转移到 ProcessDefinitionInitializer 的 `@RequiredArgsConstructor`
- 再修掉它 → 又转移到 WebMvcConfig

即"跳过编译顺序中第一个使用 Lombok 的类"，打地鼠式失败。JDK 24 与 26 均复现，Lombok 1.18.46。

## 解决

**整个 approval-server 彻底移除 Lombok**（仅 6 处 `@RequiredArgsConstructor`，全部改为显式构造器；pom.xml 删除 lombok 依赖）。构建稳定通过。

## 预防

- approval-server 及后续新建后端子服务**不要引入 Lombok**，构造器/Logger 手写
- 若主服务（material-system-server）出现同类"未在默认构造器中初始化"错误，直接改显式代码，不要排查 Lombok 版本
