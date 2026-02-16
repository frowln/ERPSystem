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
 * Sends reminders about overdue safety inspections every weekday at 07:00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class SafetyInspectionReminderJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 7 * * MON-FRI")
    public void remindOverdueInspections() {
        long start = System.currentTimeMillis();
        log.info("[SafetyInspectionReminderJob] START - Checking overdue safety inspections");

        try {
            LocalDate today = LocalDate.now();

            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT si.id, si.inspection_type, si.scheduled_date, si.location,
                           p.name AS project_name,
                           u.email AS inspector_email, u.full_name AS inspector_name
                    FROM safety_inspections si
                    JOIN projects p ON p.id = si.project_id
                    LEFT JOIN users u ON u.id = si.inspector_id
                    WHERE si.deleted = false
                      AND si.status IN ('PLANNED', 'OVERDUE')
                      AND si.scheduled_date < ?
                    ORDER BY si.scheduled_date ASC
                    """,
                    today
            );

            log.info("[SafetyInspectionReminderJob] Found {} overdue inspections", rows.size());

            for (var row : rows) {
                try {
                    String email = (String) row.get("inspector_email");
                    if (email == null || email.isBlank()) {
                        continue;
                    }

                    LocalDate scheduledDate = ((java.sql.Date) row.get("scheduled_date")).toLocalDate();
                    long overdueDays = ChronoUnit.DAYS.between(scheduledDate, today);

                    emailService.sendEmailAsync(
                            email,
                            "Напоминание: просроченная проверка безопасности",
                            "email/safety-inspection-reminder",
                            Map.of(
                                    "inspectionType", row.getOrDefault("inspection_type", ""),
                                    "scheduledDate", scheduledDate.format(DATE_FMT),
                                    "overdueDays", overdueDays,
                                    "location", row.getOrDefault("location", ""),
                                    "projectName", row.getOrDefault("project_name", ""),
                                    "inspectorName", row.getOrDefault("inspector_name", ""),
                                    "inspectionId", row.get("id").toString()
                            )
                    );
                } catch (Exception e) {
                    log.error("[SafetyInspectionReminderJob] Error processing inspection: {}", e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("[SafetyInspectionReminderJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[SafetyInspectionReminderJob] END - Completed in {} ms", elapsed);
    }
}
