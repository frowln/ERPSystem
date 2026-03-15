package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Daily cleanup of old audit log entries.
 *
 * <p>Runs at 03:00 every day and deletes audit log records older than 365 days
 * to keep the {@code audit_logs} table from growing unbounded.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class AuditLogRetentionJob {

    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 3 * * *")
    public void deleteOldAuditLogs() {
        long start = System.currentTimeMillis();
        log.info("[AuditLogRetentionJob] START - Purging audit logs older than 365 days");

        try {
            int deleted = jdbcTemplate.update(
                    "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '365 days'"
            );

            log.info("[AuditLogRetentionJob] Deleted {} old audit log entries", deleted);
        } catch (Exception e) {
            log.error("[AuditLogRetentionJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[AuditLogRetentionJob] END - Completed in {} ms", elapsed);
    }
}
