package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Checks employee certificates nearing expiration daily at 06:00.
 * Sends alerts for certificates expiring within 30 days.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CertificateExpirationJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 6 * * *")
    public void checkExpiringCertificates() {
        long start = System.currentTimeMillis();
        log.info("[CertificateExpirationJob] START - Checking employee certificates nearing expiration");

        try {
            LocalDate today = LocalDate.now();
            LocalDate threshold = today.plusDays(30);

            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT ec.id, ec.certificate_type, ec.certificate_number, ec.expiry_date,
                           e.full_name AS employee_name, e.email AS employee_email,
                           e.id AS employee_id
                    FROM employee_certificates ec
                    JOIN employees e ON e.id = ec.employee_id
                    WHERE ec.deleted = false
                      AND e.deleted = false
                      AND ec.expiry_date BETWEEN ? AND ?
                    ORDER BY ec.expiry_date ASC
                    """,
                    today, threshold
            );

            log.info("[CertificateExpirationJob] Found {} certificates expiring within 30 days", rows.size());

            for (var row : rows) {
                try {
                    String email = (String) row.get("employee_email");
                    if (email == null || email.isBlank()) {
                        continue;
                    }

                    LocalDate expiryDate = ((java.sql.Date) row.get("expiry_date")).toLocalDate();
                    long daysLeft = ChronoUnit.DAYS.between(today, expiryDate);
                    String employeeName = (String) row.getOrDefault("employee_name", "");

                    emailService.sendEmailAsync(
                            email,
                            String.format("Сертификат сотрудника %s истекает через %d дней", employeeName, daysLeft),
                            "email/certificate-expiration",
                            Map.of(
                                    "employeeName", employeeName,
                                    "certificateType", row.getOrDefault("certificate_type", ""),
                                    "certificateNumber", row.getOrDefault("certificate_number", ""),
                                    "expiryDate", expiryDate.format(DATE_FMT),
                                    "daysLeft", daysLeft,
                                    "employeeId", row.get("employee_id").toString()
                            )
                    );
                } catch (Exception e) {
                    log.error("[CertificateExpirationJob] Error processing certificate: {}", e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("[CertificateExpirationJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[CertificateExpirationJob] END - Completed in {} ms", elapsed);
    }
}
