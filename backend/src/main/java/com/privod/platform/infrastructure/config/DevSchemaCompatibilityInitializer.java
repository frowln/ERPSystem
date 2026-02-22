package com.privod.platform.infrastructure.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("dev")
public class DevSchemaCompatibilityInitializer implements ApplicationRunner, Ordered {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureOrganizationColumn("contracts", "idx_contract_org");
        ensureOrganizationColumn("purchase_requests", "idx_pr_org");
    }

    private void ensureOrganizationColumn(String tableName, String indexName) {
        if (!tableExists(tableName)) {
            return;
        }

        if (!columnExists(tableName, "organization_id")) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN organization_id UUID");
            log.warn("Added missing column {}.organization_id in dev compatibility mode", tableName);
        }

        UUID organizationId = findDefaultOrganizationId();
        if (organizationId != null) {
            int updated = jdbcTemplate.update(
                    "UPDATE " + tableName + " SET organization_id = ? WHERE organization_id IS NULL",
                    organizationId
            );
            if (updated > 0) {
                log.warn("Backfilled {} rows in {}.organization_id with {}", updated, tableName, organizationId);
            }
        }

        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS " + indexName + " ON " + tableName + "(organization_id)");
    }

    private boolean tableExists(String tableName) {
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

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = ?
                  AND column_name = ?
                """,
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }

    private UUID findDefaultOrganizationId() {
        if (!tableExists("organizations")) {
            return null;
        }

        List<UUID> ids = jdbcTemplate.query(
                """
                SELECT id
                FROM organizations
                WHERE deleted = false
                ORDER BY created_at ASC
                LIMIT 1
                """,
                (rs, rowNum) -> rs.getObject("id", UUID.class)
        );
        if (!ids.isEmpty()) {
            return ids.get(0);
        }

        List<UUID> allIds = jdbcTemplate.query(
                "SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1",
                (rs, rowNum) -> rs.getObject("id", UUID.class)
        );
        return allIds.isEmpty() ? null : allIds.get(0);
    }
}
