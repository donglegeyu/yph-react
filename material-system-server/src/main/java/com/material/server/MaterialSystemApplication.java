package com.material.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;

/**
 * 排除 FlywayAutoConfiguration：
 * Spring Boot 3.2.5 的自动配置要求 Flyway 9.x，但服务器 MySQL 5.7 只能用 7.15.0。
 * 由 FlywayConfig 类手动接管迁移逻辑。
 */
@SpringBootApplication(exclude = { FlywayAutoConfiguration.class })
public class MaterialSystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(MaterialSystemApplication.class, args);
    }
}
