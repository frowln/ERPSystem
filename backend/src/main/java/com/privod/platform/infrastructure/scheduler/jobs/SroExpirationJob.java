package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Daily job that checks SRO verification cache entries for problems:
 * <ul>
 *   <li>Status is not ACTIVE (SUSPENDED, EXCLUDED, NOT_FOUND, UNKNOWN)</li>
 *   <li>Verification hasn't been refreshed in 30+ days</li>
 * </ul>
 *
 * Sends SAFETY_ALERT notifications to all admin users, since SRO membership
 * is a legal requirement for construction contractors in Russia (ФЗ-315).
 *
 * Runs every day at 07:00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class SroExpirationJob {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    @Scheduled(cron = "0 0 7 * * *")
    public void checkSroVerifications() {
        long start = System.currentTimeMillis();
        log.info("[SroExpirationJob] START - Checking SRO verification cache");

        try {
            LocalDateTime staleThreshold = LocalDateTime.now().minusDays(30);

            // Find entries with non-ACTIVE status or stale verification
            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT s.id, s.inn, s.company_name, s.sro_name, s.sro_number,
                           s.status, s.verified_at, s.cached_at
                    FROM sro_verification_cache s
                    WHERE s.deleted = false
                      AND (
                          s.status != 'ACTIVE'
                          OR s.verified_at IS NULL
                          OR s.verified_at < ?
                      )
                    ORDER BY s.verified_at ASC NULLS FIRST
                    """,
                    Timestamp.valueOf(staleThreshold)
            );

            log.info("[SroExpirationJob] Found {} SRO entries requiring attention", rows.size());

            if (rows.isEmpty()) {
                long elapsed = System.currentTimeMillis() - start;
                log.info("[SroExpirationJob] END - No issues found, completed in {} ms", elapsed);
                return;
            }

            // Find all admin users to notify
            var adminUsers = jdbcTemplate.queryForList(
                    """
                    SELECT id FROM users
                    WHERE deleted = false
                      AND role = 'ADMIN'
                      AND enabled = true
                    """
            );

            if (adminUsers.isEmpty()) {
                log.warn("[SroExpirationJob] No active admin users found to notify");
                long elapsed = System.currentTimeMillis() - start;
                log.info("[SroExpirationJob] END - Completed in {} ms (no admins)", elapsed);
                return;
            }

            int sent = 0;
            for (var row : rows) {
                try {
                    UUID entryId = (UUID) row.get("id");
                    String inn = (String) row.getOrDefault("inn", "");
                    String companyName = (String) row.getOrDefault("company_name", inn);
                    String status = (String) row.getOrDefault("status", "UNKNOWN");
                    Timestamp verifiedAt = (Timestamp) row.get("verified_at");

                    boolean isNonActive = !"ACTIVE".equals(status);
                    boolean isStale = verifiedAt == null
                            || verifiedAt.toLocalDateTime().isBefore(staleThreshold);

                    String title;
                    String message;

                    if (isNonActive) {
                        title = String.format("СРО: %s — статус %s", companyName, status);
                        message = String.format(
                                "Подрядчик «%s» (ИНН %s) имеет статус членства в СРО: %s. " +
                                "Работа с данным подрядчиком может быть запрещена по ФЗ-315.",
                                companyName, inn, status
                        );
                    } else {
                        // Stale verification
                        String verifiedStr = verifiedAt != null
                                ? verifiedAt.toLocalDateTime().format(DATETIME_FMT)
                                : "никогда";
                        long daysSinceVerification = verifiedAt != null
                                ? ChronoUnit.DAYS.between(verifiedAt.toLocalDateTime(), LocalDateTime.now())
                                : -1;
                        title = String.format("СРО: требуется повторная проверка — %s", companyName);
                        message = String.format(
                                "Проверка СРО подрядчика «%s» (ИНН %s) устарела: " +
                                "последняя проверка %s (%d дн. назад). Рекомендуется обновить данные.",
                                companyName, inn, verifiedStr, daysSinceVerification
                        );
                    }

                    // Send notification to each admin
                    for (var admin : adminUsers) {
                        UUID adminId = (UUID) admin.get("id");
                        notificationService.send(
                                adminId,
                                title,
                                message,
                                NotificationType.SAFETY_ALERT,
                                "sro_verification",
                                entryId,
                                "/prequalification/sro?inn=" + inn
                        );
                        sent++;
                    }
                } catch (Exception e) {
                    log.error("[SroExpirationJob] Error processing SRO entry {}: {}", row.get("id"), e.getMessage(), e);
                }
            }

            log.info("[SroExpirationJob] Sent {} SRO alert notifications ({} entries x {} admins)",
                    sent, rows.size(), adminUsers.size());

        } catch (Exception e) {
            log.error("[SroExpirationJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[SroExpirationJob] END - Completed in {} ms", elapsed);
    }
}
