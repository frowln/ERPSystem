package com.privod.platform.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.api.FlywayException;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.util.Locale;

/**
 * Keeps local DEV boot resilient when schema history is corrupted or was manually drifted.
 * On a known dirty-baseline pattern we rebuild schema from migrations+seed.
 */
@Slf4j
@Configuration
@Profile("dev")
public class DevFlywayRecoveryConfig {

    @Bean
    FlywayMigrationStrategy devFlywayMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            try {
                flyway.migrate();
            } catch (FlywayException ex) {
                if (shouldRecreateFromScratch(dataSource, ex)) {
                    log.warn("Detected dirty dev Flyway baseline. Recreating schema from migrations and seed.");
                    flyway.clean();
                    flyway.migrate();
                    return;
                }
                throw ex;
            }
        };
    }

    private boolean shouldRecreateFromScratch(DataSource dataSource, Throwable error) {
        String msg = rootMessage(error).toLowerCase(Locale.ROOT);
        if (!msg.contains("already exists")) {
            return false;
        }

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        if (!tableExists(jdbcTemplate, "flyway_schema_history")) {
            return false;
        }

        Integer successfulMigrations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE success = true",
                Integer.class
        );
        String maxVersion = jdbcTemplate.queryForObject(
                "SELECT MAX(version) FROM flyway_schema_history WHERE success = true",
                String.class
        );

        // Typical broken local state: only Flyway baseline record exists,
        // while application tables were created outside current migration chain.
        return successfulMigrations != null
                && successfulMigrations == 1
                && "1".equals(maxVersion)
                && tableExists(jdbcTemplate, "users");
    }

    private boolean tableExists(JdbcTemplate jdbcTemplate, String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = ?
                """,
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }

    private String rootMessage(Throwable throwable) {
        Throwable root = throwable;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        return root.getMessage() == null ? "" : root.getMessage();
    }
}
