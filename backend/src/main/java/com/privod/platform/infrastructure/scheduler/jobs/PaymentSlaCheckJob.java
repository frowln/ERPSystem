package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Checks payments nearing SLA deadlines every weekday at 10:00.
 * Alerts finance team about payments that need urgent processing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class PaymentSlaCheckJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 10 * * MON-FRI")
    public void checkPaymentSla() {
        long start = System.currentTimeMillis();
        log.info("[PaymentSlaCheckJob] START - Checking payments nearing SLA deadlines");

        try {
            LocalDate today = LocalDate.now();
            LocalDate slaThreshold = today.plusDays(3);

            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT p.id, p.payment_number, p.amount, p.currency,
                           p.due_date, p.status,
                           c.contract_number, c.name AS contract_name,
                           u.email AS approver_email, u.full_name AS approver_name
                    FROM payments p
                    LEFT JOIN contracts c ON c.id = p.contract_id
                    LEFT JOIN users u ON u.id = p.approver_id
                    WHERE p.deleted = false
                      AND p.status IN ('PENDING', 'AWAITING_APPROVAL')
                      AND p.due_date BETWEEN ? AND ?
                    ORDER BY p.due_date ASC
                    """,
                    today, slaThreshold
            );

            log.info("[PaymentSlaCheckJob] Found {} payments nearing SLA deadline", rows.size());

            for (var row : rows) {
                try {
                    String email = (String) row.get("approver_email");
                    if (email == null || email.isBlank()) {
                        continue;
                    }

                    String paymentNumber = (String) row.getOrDefault("payment_number", "");
                    LocalDate dueDate = ((java.sql.Date) row.get("due_date")).toLocalDate();
                    long daysLeft = ChronoUnit.DAYS.between(today, dueDate);
                    BigDecimal amount = row.get("amount") != null
                            ? new BigDecimal(row.get("amount").toString()) : BigDecimal.ZERO;

                    emailService.sendEmailAsync(
                            email,
                            String.format("Требуется утверждение платежа №%s", paymentNumber),
                            "email/payment-approval",
                            Map.of(
                                    "paymentNumber", paymentNumber,
                                    "amount", amount.toPlainString(),
                                    "currency", row.getOrDefault("currency", "RUB"),
                                    "dueDate", dueDate.format(DATE_FMT),
                                    "daysLeft", daysLeft,
                                    "contractNumber", row.getOrDefault("contract_number", ""),
                                    "contractName", row.getOrDefault("contract_name", ""),
                                    "approverName", row.getOrDefault("approver_name", ""),
                                    "paymentId", row.get("id").toString()
                            )
                    );
                } catch (Exception e) {
                    log.error("[PaymentSlaCheckJob] Error processing payment: {}", e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("[PaymentSlaCheckJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[PaymentSlaCheckJob] END - Completed in {} ms", elapsed);
    }
}
