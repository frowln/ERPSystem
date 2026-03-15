package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Daily cleanup of stale notifications and notification events.
 *
 * <p>Runs at 03:30 every day and performs two operations:
 * <ol>
 *   <li>Deletes read notifications older than 90 days from {@code notifications}.</li>
 *   <li>Deletes notification events older than 180 days from {@code notification_events}.</li>
 * </ol>
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class NotificationCleanupJob {

    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 30 3 * * *")
    public void cleanupOldNotifications() {
        long start = System.currentTimeMillis();
        log.info("[NotificationCleanupJob] START - Cleaning up old notifications and events");

        try {
            int deletedNotifications = jdbcTemplate.update(
                    "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days' AND is_read = true"
            );
            log.info("[NotificationCleanupJob] Deleted {} read notifications older than 90 days", deletedNotifications);

            int deletedEvents = jdbcTemplate.update(
                    "DELETE FROM notification_events WHERE created_at < NOW() - INTERVAL '180 days'"
            );
            log.info("[NotificationCleanupJob] Deleted {} notification events older than 180 days", deletedEvents);

        } catch (Exception e) {
            log.error("[NotificationCleanupJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[NotificationCleanupJob] END - Completed in {} ms", elapsed);
    }
}
