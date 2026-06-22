package com.material.server.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.nio.charset.Charset;

/**
 * Flyway 手动配置（绕过 Spring Boot 自动配置）
 *
 * 背景：服务器 MySQL 5.7 不被 Flyway 8.0+ 社区版支持，
 * 而能与 Spring Boot 3.2.5 兼容的 Flyway 9.x 又抛弃了 MySQL 5.7。
 * 因此锁定 Flyway 7.15.0 并手动初始化，跳过 Spring Boot 的 FlywayAutoConfiguration。
 *
 * 启动方式：应用启动时在 PostConstruct 阶段执行 Flyway.migrate()。
 * 配置项读取 application.yml 中已有的 spring.datasource.* 和 spring.flyway.*。
 */
@Configuration
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true", matchIfMissing = true)
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:root}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Value("${spring.flyway.locations:classpath:db/migration}")
    private String locations;

    @Value("${spring.flyway.table:flyway_schema_history}")
    private String table;

    @Value("${spring.flyway.baseline-version:0}")
    private String baselineVersion;

    @Value("${spring.flyway.encoding:UTF-8}")
    private String encoding;

    @PostConstruct
    public void migrateFlyway() {
        log.info("Flyway 手动初始化（版本 7.15.0，兼容 MySQL 5.7）");
        log.info("数据库：{}", datasourceUrl);

        Flyway flyway = Flyway.configure()
                .dataSource(datasourceUrl, datasourceUsername, datasourcePassword)
                .locations(locations.split(","))
                .table(table)
                .baselineVersion(baselineVersion)
                .baselineOnMigrate(true)
                .validateOnMigrate(false)
                .outOfOrder(false)
                .encoding(Charset.forName(encoding))
                .load();

        flyway.migrate();
        log.info("Flyway 迁移完成");
    }
}
