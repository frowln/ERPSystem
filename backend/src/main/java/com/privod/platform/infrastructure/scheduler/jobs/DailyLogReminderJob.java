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
 * Reminds foremen to submit daily logs every weekday at 17:00.
 * Checks which active projects have not yet received a daily log for today.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DailyLogReminderJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 17 * * MON-FRI")
    public void remindDailyLogs() {
        long start = System.currentTimeMillis();
        log.info("[DailyLogReminderJob] START - Reminding foremen to submit daily logs");

        try {
            LocalDate today = LocalDate.now();

            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT p.id AS project_id, p.name AS project_name,
                           u.email AS foreman_email, u.full_name AS foreman_name
                    FROM projects p
                    JOIN users u ON u.id = p.foreman_id
                    WHERE p.deleted = false
                      AND p.status = 'ACTIVE'
                      AND u.email IS NOT NULL
                      AND NOT EXISTS (
                          SELECT 1 FROM daily_logs dl
                          WHERE dl.project_id = p.id
                            AND dl.log_date = ?
                            AND dl.deleted = false
                      )
                    """,
                    today
            );

            log.info("[DailyLogReminderJob] Found {} projects without daily logs for {}", rows.size(), today);

            for (var row : rows) {
                try {
                    String email = (String) row.get("foreman_email");
                    if (email == null || email.isBlank()) {
                        continue;
                    }

                    emailService.sendEmailAsync(
                            email,
                            String.format("Напоминание: заполните журнал работ за %s", today.format(DATE_FMT)),
                            "email/daily-log-reminder",
                            Map.of(
                                    "foremanName", row.getOrDefault("foreman_name", ""),
                                    "projectName", row.getOrDefault("project_name", ""),
                                    "date", today.format(DATE_FMT),
                                    "projectId", row.get("project_id").toString()
                            )
                    );
                } catch (Exception e) {
                    log.error("[DailyLogReminderJob] Error processing project: {}", e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("[DailyLogReminderJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[DailyLogReminderJob] END - Completed in {} ms", elapsed);
    }
}
