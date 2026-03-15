package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.modules.integration.telegram.service.TelegramBotService;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Checks support ticket SLA every 30 minutes.
 * Escalates tickets that are about to breach or have breached their SLA.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class SupportSlaCheckJob {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    @Autowired(required = false)
    private TelegramBotService telegramBotService;

    @Scheduled(cron = "0 */30 * * * *")
    public void checkSupportTicketSla() {
        long start = System.currentTimeMillis();
        log.info("[SupportSlaCheckJob] START - Checking support ticket SLA compliance");

        try {
            Timestamp now = Timestamp.from(Instant.now());

            // Find tickets that are about to breach SLA (query BEFORE update)
            List<Map<String, Object>> aboutToBreach = jdbcTemplate.queryForList(
                    """
                    SELECT id, code, subject, assignee_id
                    FROM support_tickets
                    WHERE deleted = false
                      AND status NOT IN ('RESOLVED', 'CLOSED')
                      AND sla_status != 'BREACHED'
                      AND sla_deadline_at < ?
                    """,
                    now
            );

            // Mark as BREACHED
            int breached = jdbcTemplate.update(
                    """
                    UPDATE support_tickets
                    SET sla_status = 'BREACHED', updated_at = NOW()
                    WHERE deleted = false
                      AND status NOT IN ('RESOLVED', 'CLOSED')
                      AND sla_status != 'BREACHED'
                      AND sla_deadline_at < ?
                    """,
                    now
            );

            if (breached > 0) {
                log.warn("[SupportSlaCheckJob] {} tickets have breached SLA!", breached);

                // Send notifications for each breached ticket
                for (Map<String, Object> row : aboutToBreach) {
                    String code = (String) row.get("code");
                    String subject = (String) row.get("subject");
                    UUID assigneeId = row.get("assignee_id") != null ? (UUID) row.get("assignee_id") : null;
                    UUID ticketId = (UUID) row.get("id");

                    // Notify assignee via in-app notification
                    if (assigneeId != null) {
                        try {
                            notificationService.send(
                                    assigneeId,
                                    "SLA нарушен: " + code,
                                    "SLA нарушен по тикету " + code + ": " + subject,
                                    NotificationType.WARNING,
                                    "SupportTicket",
                                    ticketId,
                                    "/support/tickets/" + ticketId
                            );
                        } catch (Exception e) {
                            log.warn("[SupportSlaCheckJob] Failed to send SLA breach notification for ticket {}: {}",
                                    code, e.getMessage());
                        }
                    }

                    // Also try Telegram
                    if (telegramBotService != null) {
                        try {
                            telegramBotService.sendMessage(null,
                                    "\u26A0\uFE0F SLA нарушен по тикету " + code + ": " + subject);
                        } catch (Exception e) {
                            log.warn("[SupportSlaCheckJob] Failed to send Telegram SLA breach alert for ticket {}: {}",
                                    code, e.getMessage());
                        }
                    }
                }
            }

            // Find tickets approaching SLA breach (within 1 hour)
            Timestamp warningThreshold = Timestamp.from(Instant.now().plus(1, ChronoUnit.HOURS));

            var warningTickets = jdbcTemplate.queryForList(
                    """
                    SELECT id, ticket_number, subject, priority,
                           sla_deadline_at, assigned_to
                    FROM support_tickets
                    WHERE deleted = false
                      AND status NOT IN ('RESOLVED', 'CLOSED')
                      AND sla_status = 'ON_TRACK'
                      AND sla_deadline_at BETWEEN ? AND ?
                    ORDER BY sla_deadline_at ASC
                    """,
                    now, warningThreshold
            );

            if (!warningTickets.isEmpty()) {
                log.warn("[SupportSlaCheckJob] {} tickets approaching SLA breach (within 1 hour)",
                        warningTickets.size());

                // Mark as AT_RISK
                jdbcTemplate.update(
                        """
                        UPDATE support_tickets
                        SET sla_status = 'AT_RISK', updated_at = NOW()
                        WHERE deleted = false
                          AND status NOT IN ('RESOLVED', 'CLOSED')
                          AND sla_status = 'ON_TRACK'
                          AND sla_deadline_at BETWEEN ? AND ?
                        """,
                        now, warningThreshold
                );
            }

            log.info("[SupportSlaCheckJob] SLA check complete: breached={}, at_risk={}",
                    breached, warningTickets.size());

        } catch (Exception e) {
            log.error("[SupportSlaCheckJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[SupportSlaCheckJob] END - Completed in {} ms", elapsed);
    }
}
