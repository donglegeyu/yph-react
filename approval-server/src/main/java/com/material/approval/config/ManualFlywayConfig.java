package com.material.approval.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;

/**
 * Boot 3.5 的 FlywayAutoConfiguration 按 Flyway 11 编写，与锁定在 7.15.0（最后支持 MySQL 5.7）
 * 的 FluentConfiguration 不兼容（placeholderSeparator 等新方法不存在）。
 * 因此关闭 Boot 自动配置，改用 Flyway 7.15 的 Java API 手动执行迁移。
 * 迁移仍由 Flyway 管理，不是绕过迁移。
 */
@Configuration
@ConditionalOnProperty(name = "appr.flyway.enabled", havingValue = "true")
public class ManualFlywayConfig {

    @Bean(initMethod = "migrate")
    public Flyway approvalFlyway(DataSource dataSource,
                                 @Value("${appr.flyway.locations:classpath:db/migration/approval}") String locations,
                                 @Value("${appr.flyway.table:flyway_schema_history_approval}") String table,
                                 @Value("${appr.flyway.baseline-version:0}") String baselineVersion) {
        return Flyway.configure()
                .dataSource(dataSource)
                .locations(locations)
                .table(table)
                .baselineOnMigrate(true)
                .baselineVersion(baselineVersion)
                .encoding(StandardCharsets.UTF_8)
                .validateOnMigrate(false)
                .load();
    }
}
