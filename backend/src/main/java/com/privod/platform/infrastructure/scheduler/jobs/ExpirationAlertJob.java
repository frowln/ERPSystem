package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Daily job that checks for expiring documents across multiple entity types and
 * sends in-app notifications to admin users at predefined intervals before expiry.
 *
 * <p>Checked entity types:
 * <ul>
 *   <li>SRO licenses (regulatory_licenses)</li>
 *   <li>Safety training certificates (safety_trainings.valid_until)</li>
 *   <li>Employee medical exams (employees.medical_exam_date)</li>
 *   <li>Contracts (contracts.end_date)</li>
 *   <li>Employee certificates (employee_certificates.expiry_date)</li>
 * </ul>
 *
 * Runs every day at 08:00 Moscow time.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ExpirationAlertJob {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final int[] ALERT_DAYS = {30, 14, 7, 1};

    @Scheduled(cron = "0 0 8 * * *", zone = "Europe/Moscow")
    public void checkExpiringDocuments() {
        long start = System.currentTimeMillis();
        log.info("[ExpirationAlertJob] START - Checking expiring documents");

        int totalAlerts = 0;

        try {
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
                log.warn("[ExpirationAlertJob] No active admin users found to notify");
                long elapsed = System.currentTimeMillis() - start;
                log.info("[ExpirationAlertJob] END - Completed in {} ms (no admins)", elapsed);
                return;
            }

            var adminIds = adminUsers.stream()
                    .map(row -> (UUID) row.get("id"))
                    .toList();

            // Check safety trainings (valid_until)
            totalAlerts += checkExpiringTable(adminIds,
                    "safety_trainings", "valid_until", "topic",
                    "Сертификат ОТ", "safety_training", "/safety/trainings");

            // Check employee medical exams
            totalAlerts += checkExpiringTable(adminIds,
                    "employees", "medical_exam_date", "CONCAT(last_name, ' ', first_name)",
                    "Медосмотр", "employee", "/hr/employees");

            // Check contracts
            totalAlerts += checkExpiringTable(adminIds,
                    "contracts", "end_date", "name",
                    "Контракт", "contract", "/contracts");

            // Check employee certificates
            totalAlerts += checkExpiringTable(adminIds,
                    "employee_certificates", "expiry_date", "certificate_type",
                    "Сертификат сотрудника", "employee_certificate", "/hr/employees");

        } catch (Exception e) {
            log.error("[ExpirationAlertJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[ExpirationAlertJob] END - Completed in {} ms. Total alerts: {}", elapsed, totalAlerts);
    }

    /**
     * Check a single table for rows expiring exactly N days from now (for each N in ALERT_DAYS).
     * Sends notifications to all admin users for each match.
     */
    private int checkExpiringTable(java.util.List<UUID> adminIds,
                                    String table, String dateColumn, String nameExpression,
                                    String documentType, String sourceModel, String baseUrl) {
        int count = 0;
        LocalDate today = LocalDate.now();

        for (int days : ALERT_DAYS) {
            try {
                LocalDate targetDate = today.plusDays(days);

                String sql = String.format(
                        "SELECT id, %s AS doc_name, %s AS expiry_date FROM %s " +
                        "WHERE deleted = false AND %s = ?",
                        nameExpression, dateColumn, table, dateColumn
                );

                var rows = jdbcTemplate.queryForList(sql, targetDate);

                for (var row : rows) {
                    UUID entityId = (UUID) row.get("id");
                    String docName = String.valueOf(row.get("doc_name"));
                    LocalDate expiryDate = targetDate;

                    String title = String.format("%s «%s» — истекает через %d дн.",
                            documentType, docName, days);
                    String message = String.format(
                            "%s «%s» истекает %s (через %d дн.). Требуется продление или обновление.",
                            documentType, docName, expiryDate.format(DATE_FMT), days);
                    String actionUrl = baseUrl + "?id=" + entityId;

                    for (UUID adminId : adminIds) {
                        try {
                            notificationService.send(
                                    adminId,
                                    title,
                                    message,
                                    NotificationType.WARNING,
                                    sourceModel,
                                    entityId,
                                    actionUrl
                            );
                            count++;
                        } catch (Exception e) {
                            log.error("[ExpirationAlertJob] Failed to send notification to admin {}: {}",
                                    adminId, e.getMessage());
                        }
                    }

                    log.info("[ExpirationAlertJob] {} '{}' expires in {} days ({})",
                            documentType, docName, days, expiryDate.format(DATE_FMT));
                }
            } catch (Exception e) {
                // Table might not exist or column mismatch — skip gracefully
                log.debug("[ExpirationAlertJob] Table {} check skipped: {}", table, e.getMessage());
            }
        }

        return count;
    }
}
