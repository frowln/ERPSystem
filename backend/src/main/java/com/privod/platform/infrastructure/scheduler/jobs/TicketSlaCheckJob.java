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
 * Daily job that checks for support tickets whose dueDate has passed
 * and whose status is not CLOSED or RESOLVED. Sends WARNING notifications
 * to the ticket assignee (or reporter if no assignee is set).
 *
 * Runs every day at 07:00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class TicketSlaCheckJob {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 7 * * *")
    public void checkOverdueTickets() {
        long start = System.currentTimeMillis();
        log.info("[TicketSlaCheckJob] START - Checking overdue support tickets");

        try {
            LocalDate today = LocalDate.now();

            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT t.id, t.code, t.subject, t.due_date, t.status, t.priority,
                           t.assignee_id, t.reporter_id
                    FROM support_tickets t
                    WHERE t.deleted = false
                      AND t.due_date < ?
                      AND t.status NOT IN ('CLOSED', 'RESOLVED')
                    ORDER BY t.due_date ASC
                    """,
                    today
            );

            log.info("[TicketSlaCheckJob] Found {} overdue tickets", rows.size());

            int sent = 0;
            for (var row : rows) {
                try {
                    // Notify assignee first; fall back to reporter
                    UUID recipientId = (UUID) row.get("assignee_id");
                    if (recipientId == null) {
                        recipientId = (UUID) row.get("reporter_id");
                    }
                    if (recipientId == null) {
                        log.debug("[TicketSlaCheckJob] Skipping ticket {} — no assignee or reporter", row.get("id"));
                        continue;
                    }

                    UUID ticketId = (UUID) row.get("id");
                    String code = (String) row.getOrDefault("code", "");
                    String subject = (String) row.getOrDefault("subject", "");
                    String priority = (String) row.getOrDefault("priority", "");
                    LocalDate dueDate = ((java.sql.Date) row.get("due_date")).toLocalDate();
                    long daysOverdue = ChronoUnit.DAYS.between(dueDate, today);

                    String title = String.format("Просроченный тикет: %s", code);
                    String message = String.format(
                            "Тикет %s «%s» (приоритет: %s) просрочен на %d дн. (срок: %s)",
                            code, subject, priority, daysOverdue, dueDate.format(DATE_FMT)
                    );

                    notificationService.send(
                            recipientId,
                            title,
                            message,
                            NotificationType.WARNING,
                            "support_ticket",
                            ticketId,
                            "/support/tickets?selected=" + ticketId
                    );
                    sent++;
                } catch (Exception e) {
                    log.error("[TicketSlaCheckJob] Error processing ticket {}: {}", row.get("id"), e.getMessage(), e);
                }
            }

            log.info("[TicketSlaCheckJob] Sent {} overdue ticket notifications", sent);

        } catch (Exception e) {
            log.error("[TicketSlaCheckJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[TicketSlaCheckJob] END - Completed in {} ms", elapsed);
    }
}
