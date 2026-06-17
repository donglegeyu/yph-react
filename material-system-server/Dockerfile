# ============================================
# 后端 Dockerfile (material-system-server)
# Spring Boot 3.2.5 + Java 17 + Maven
# ============================================

# ---------- 阶段1: Maven 构建 ----------
FROM registry.zrhsh.com/library/base-image:jdk17-gradle8.14-mvn3.9-ci-v1.0.0 AS builder
WORKDIR /build

# 先复制 pom.xml 利用 Docker 缓存加速依赖下载
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 复制源码并编译打包
COPY src ./src
RUN mvn clean package -DskipTests -B \
    && mv target/material-system-server-1.0.0.jar target/app.jar

# ---------- 阶段2: 运行时镜像 ----------
FROM registry.zrhsh.com/library/openjdk:17-sky8.9

WORKDIR /app

# 复制构建产物并设置权限
COPY --from=builder /build/target/app.jar /app/app.jar

# 环境变量（可通过 docker run -e 或 K8s env 覆盖）
ENV SERVER_PORT=8081
ENV DB_URL=jdbc:mysql://material-mysql-react:3306/material_system_react?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&connectionCollation=utf8mb4_unicode_ci&initSql=SET NAMES utf8mb4
ENV DB_USERNAME=root
ENV DB_PASSWORD=root123456

# 时区设置
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && mkdir -p /app/uploads

# 暴露端口
EXPOSE 8081

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+AlwaysPreTouch", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
