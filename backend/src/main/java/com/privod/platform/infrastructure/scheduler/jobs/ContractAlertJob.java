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
import java.util.Map;

/**
 * Checks contracts nearing expiration (within 30 days) every weekday at 08:00.
 * Sends email alerts to responsible contract managers.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ContractAlertJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 8 * * MON-FRI")
    public void checkExpiringContracts() {
        long start = System.currentTimeMillis();
        log.info("[ContractAlertJob] START - Checking contracts nearing expiration");

        try {
            LocalDate now = LocalDate.now();
            LocalDate threshold = now.plusDays(30);

            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT c.id, c.contract_number, c.name, c.end_date,
                           c.responsible_email, c.contractor_name
                    FROM contracts c
                    WHERE c.deleted = false
                      AND c.status = 'ACTIVE'
                      AND c.end_date BETWEEN ? AND ?
                    ORDER BY c.end_date ASC
                    """,
                    now, threshold
            );

            log.info("[ContractAlertJob] Found {} contracts expiring within 30 days", rows.size());

            for (var row : rows) {
                try {
                    String email = (String) row.get("responsible_email");
                    if (email == null || email.isBlank()) {
                        continue;
                    }

                    String contractNumber = (String) row.get("contract_number");
                    LocalDate endDate = ((java.sql.Date) row.get("end_date")).toLocalDate();
                    long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(now, endDate);

                    emailService.sendEmailAsync(
                            email,
                            String.format("Договор %s истекает через %d дней", contractNumber, daysLeft),
                            "email/contract-alert",
                            Map.of(
                                    "contractNumber", contractNumber,
                                    "contractName", row.getOrDefault("name", ""),
                                    "contractorName", row.getOrDefault("contractor_name", ""),
                                    "endDate", endDate.format(DATE_FMT),
                                    "daysLeft", daysLeft,
                                    "contractId", row.get("id").toString()
                            )
                    );

                    log.debug("[ContractAlertJob] Alert sent for contract {} to {}", contractNumber, email);
                } catch (Exception e) {
                    log.error("[ContractAlertJob] Error processing contract row: {}", e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("[ContractAlertJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[ContractAlertJob] END - Completed in {} ms", elapsed);
    }
}
