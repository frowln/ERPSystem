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
 * Sends in-app notifications when task deadlines are approaching (1 or 3 days before).
 * Runs every weekday at 09:00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class TaskDeadlineReminderJob {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 9 * * MON-FRI")
    public void checkApproachingDeadlines() {
        long start = System.currentTimeMillis();
        log.info("[TaskDeadlineReminderJob] START - Checking approaching deadlines");

        try {
            LocalDate today = LocalDate.now();
            LocalDate in1Day = today.plusDays(1);
            LocalDate in3Days = today.plusDays(3);

            // Find tasks with deadlines in 1 or 3 days
            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT t.id, t.title AS task_name, t.code AS task_code, t.planned_end_date,
                           p.name AS project_name,
                           t.assignee_id, u.email AS assignee_email, u.full_name AS assignee_name
                    FROM tasks t
                    LEFT JOIN projects p ON p.id = t.project_id
                    LEFT JOIN users u ON u.id = t.assignee_id
                    WHERE t.deleted = false
                      AND t.status NOT IN ('DONE', 'CANCELLED')
                      AND t.planned_end_date IN (?, ?)
                      AND t.assignee_id IS NOT NULL
                    ORDER BY t.planned_end_date ASC
                    """,
                    in1Day, in3Days
            );

            log.info("[TaskDeadlineReminderJob] Found {} tasks with approaching deadlines", rows.size());

            int sent = 0;
            for (var row : rows) {
                try {
                    UUID assigneeId = (UUID) row.get("assignee_id");
                    if (assigneeId == null) continue;

                    String taskName = (String) row.getOrDefault("task_name", "");
                    String taskCode = (String) row.getOrDefault("task_code", "");
                    String projectName = (String) row.getOrDefault("project_name", "");
                    LocalDate dueDate = ((java.sql.Date) row.get("planned_end_date")).toLocalDate();
                    long daysLeft = ChronoUnit.DAYS.between(today, dueDate);
                    UUID taskId = (UUID) row.get("id");

                    String title = daysLeft == 1
                            ? String.format("Дедлайн завтра: %s", taskName)
                            : String.format("Дедлайн через %d дня: %s", daysLeft, taskName);

                    String message = String.format(
                            "Задача %s «%s» (проект: %s) — срок до %s",
                            taskCode, taskName, projectName, dueDate.format(DATE_FMT)
                    );

                    notificationService.send(
                            assigneeId,
                            title,
                            message,
                            NotificationType.TASK,
                            "task",
                            taskId,
                            "/tasks?selected=" + taskId
                    );
                    sent++;
                } catch (Exception e) {
                    log.error("[TaskDeadlineReminderJob] Error processing task: {}", e.getMessage(), e);
                }
            }

            log.info("[TaskDeadlineReminderJob] Sent {} deadline reminder notifications", sent);

        } catch (Exception e) {
            log.error("[TaskDeadlineReminderJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[TaskDeadlineReminderJob] END - Completed in {} ms", elapsed);
    }
}
