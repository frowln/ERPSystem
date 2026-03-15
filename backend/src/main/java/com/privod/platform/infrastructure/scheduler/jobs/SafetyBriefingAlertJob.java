package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * P1-SAF-3: Daily alert for upcoming and overdue safety briefing re-certifications.
 *
 * <p>Runs at 06:00 every day and performs two checks against {@code safety_trainings}:
 * <ol>
 *   <li><b>Upcoming:</b> Completed trainings whose {@code next_scheduled_date} falls within the
 *       next 14 days — a reminder to schedule the re-briefing in advance.</li>
 *   <li><b>Overdue:</b> Completed trainings whose {@code next_scheduled_date} is in the past and
 *       no follow-up COMPLETED training exists — the employee is operating without a valid briefing.</li>
 * </ol>
 *
 * <p>For each finding a row is inserted into {@code notification_events} so that the notification
 * subsystem can dispatch in-app alerts to the responsible safety officer.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class SafetyBriefingAlertJob {

    private final JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final int UPCOMING_DAYS_AHEAD = 14;

    @Scheduled(cron = "0 0 6 * * *")
    public void alertUpcomingAndOverdueBriefings() {
        long start = System.currentTimeMillis();
        log.info("[SafetyBriefingAlertJob] START - Checking safety briefing expirations");

        try {
            LocalDate today = LocalDate.now();
            LocalDate alertThreshold = today.plusDays(UPCOMING_DAYS_AHEAD);

            // ------------------------------------------------------------------
            // Step 1: Find completed trainings with next_scheduled_date within
            // the next 14 days — upcoming re-briefing required.
            // ------------------------------------------------------------------
            List<Map<String, Object>> upcoming = jdbcTemplate.queryForList(
                    """
                    SELECT st.id, st.training_type, st.next_scheduled_date, st.organization_id,
                           e.id AS employee_id, e.first_name, e.last_name
                      FROM safety_trainings st
                      LEFT JOIN employees e ON e.id = st.employee_id AND e.deleted = false
                     WHERE st.deleted = false
                       AND st.status = 'COMPLETED'
                       AND st.next_scheduled_date IS NOT NULL
                       AND st.next_scheduled_date BETWEEN ? AND ?
                    """,
                    today, alertThreshold
            );

            if (!upcoming.isEmpty()) {
                log.warn("[SafetyBriefingAlertJob] {} briefing(s) due within {} days (by {}):",
                        upcoming.size(), UPCOMING_DAYS_AHEAD, alertThreshold.format(DATE_FMT));
                for (Map<String, Object> row : upcoming) {
                    log.warn("  - {} {}: {} next={}", row.get("first_name"), row.get("last_name"),
                            row.get("training_type"), row.get("next_scheduled_date"));
                }
                insertNotificationEvents(upcoming, "UPCOMING_BRIEFING",
                        "Требуется повторный инструктаж в течение " + UPCOMING_DAYS_AHEAD + " дней");
            } else {
                log.info("[SafetyBriefingAlertJob] No upcoming briefings in the next {} days", UPCOMING_DAYS_AHEAD);
            }

            // ------------------------------------------------------------------
            // Step 2: Find completed trainings whose next_scheduled_date is past
            // — the employee's briefing has lapsed.
            // ------------------------------------------------------------------
            List<Map<String, Object>> overdue = jdbcTemplate.queryForList(
                    """
                    SELECT st.id, st.training_type, st.next_scheduled_date, st.organization_id,
                           e.id AS employee_id, e.first_name, e.last_name
                      FROM safety_trainings st
                      LEFT JOIN employees e ON e.id = st.employee_id AND e.deleted = false
                     WHERE st.deleted = false
                       AND st.status = 'COMPLETED'
                       AND st.next_scheduled_date IS NOT NULL
                       AND st.next_scheduled_date < ?
                    """,
                    today
            );

            if (!overdue.isEmpty()) {
                log.warn("[SafetyBriefingAlertJob] {} employee(s) with OVERDUE safety briefing:", overdue.size());
                for (Map<String, Object> row : overdue) {
                    log.warn("  OVERDUE: {} {}: {} was due {}", row.get("first_name"), row.get("last_name"),
                            row.get("training_type"), row.get("next_scheduled_date"));
                }
                insertNotificationEvents(overdue, "OVERDUE_BRIEFING",
                        "Срок инструктажа истёк — требуется немедленное прохождение");
            } else {
                log.info("[SafetyBriefingAlertJob] No overdue safety briefings");
            }

        } catch (Exception e) {
            log.error("[SafetyBriefingAlertJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[SafetyBriefingAlertJob] END - Completed in {} ms", elapsed);
    }

    private void insertNotificationEvents(List<Map<String, Object>> rows, String eventType, String message) {
        for (Map<String, Object> row : rows) {
            try {
                jdbcTemplate.update(
                        """
                        INSERT INTO notification_events
                               (id, organization_id, event_type, entity_type, entity_id, message, created_at, deleted)
                        VALUES (gen_random_uuid(), ?, ?, 'SafetyTraining', ?, ?, NOW(), false)
                        ON CONFLICT DO NOTHING
                        """,
                        row.get("organization_id"),
                        eventType,
                        row.get("id"),
                        message
                );
            } catch (Exception e) {
                log.warn("[SafetyBriefingAlertJob] Could not insert notification event for training {}: {}",
                        row.get("id"), e.getMessage());
            }
        }
    }
}
