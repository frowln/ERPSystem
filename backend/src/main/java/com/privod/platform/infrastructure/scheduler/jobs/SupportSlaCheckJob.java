package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

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

    @Scheduled(cron = "0 */30 * * * *")
    public void checkSupportTicketSla() {
        long start = System.currentTimeMillis();
        log.info("[SupportSlaCheckJob] START - Checking support ticket SLA compliance");

        try {
            Timestamp now = Timestamp.from(Instant.now());

            // Find tickets that have breached SLA (not responded within SLA hours)
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
