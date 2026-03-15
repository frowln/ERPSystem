package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Weekly soft-deletion of old messages.
 *
 * <p>Runs every Sunday at 04:00. Marks messages older than 365 days as deleted
 * and stamps them with the current timestamp in {@code deleted_at}.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class MessageArchiveJob {

    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 4 * * SUN")
    public void archiveOldMessages() {
        long start = System.currentTimeMillis();
        log.info("[MessageArchiveJob] START - Soft-deleting messages older than 365 days");

        try {
            int updated = jdbcTemplate.update(
                    """
                    UPDATE messages SET deleted = true, deleted_at = NOW()
                     WHERE created_at < NOW() - INTERVAL '365 days'
                       AND deleted = false
                    """
            );

            log.info("[MessageArchiveJob] Soft-deleted {} old messages", updated);
        } catch (Exception e) {
            log.error("[MessageArchiveJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[MessageArchiveJob] END - Completed in {} ms", elapsed);
    }
}
