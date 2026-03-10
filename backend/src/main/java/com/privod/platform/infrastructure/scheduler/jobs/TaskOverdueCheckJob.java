package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.infrastructure.email.EmailService;
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
import java.util.Map;
import java.util.UUID;

/**
 * Marks overdue tasks and notifies responsible persons every weekday at 08:30.
 * Sends both email AND in-app notifications.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class TaskOverdueCheckJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 30 8 * * MON-FRI")
    public void checkOverdueTasks() {
        long start = System.currentTimeMillis();
        log.info("[TaskOverdueCheckJob] START - Checking and marking overdue tasks");

        try {
            LocalDate today = LocalDate.now();

            // Mark tasks as OVERDUE
            int updated = jdbcTemplate.update(
                    """
                    UPDATE tasks
                    SET status = 'OVERDUE', updated_at = NOW()
                    WHERE deleted = false
                      AND status NOT IN ('COMPLETED', 'CANCELLED', 'OVERDUE')
                      AND due_date < ?
                    """,
                    today
            );
            log.info("[TaskOverdueCheckJob] Marked {} tasks as overdue", updated);

            // Fetch overdue tasks with assignee info for notifications
            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT t.id, t.name AS task_name, t.code AS task_code, t.due_date,
                           p.name AS project_name,
                           t.assignee_id, u.email AS assignee_email, u.full_name AS assignee_name
                    FROM tasks t
                    JOIN projects p ON p.id = t.project_id
                    LEFT JOIN users u ON u.id = t.assignee_id
                    WHERE t.deleted = false
                      AND t.status = 'OVERDUE'
                      AND t.due_date >= ? - INTERVAL '3 days'
                    ORDER BY t.due_date ASC
                    """,
                    today
            );

            log.info("[TaskOverdueCheckJob] Sending notifications for {} recently overdue tasks", rows.size());

            for (var row : rows) {
                try {
                    String email = (String) row.get("assignee_email");
                    String taskName = (String) row.getOrDefault("task_name", "");
                    String taskCode = (String) row.getOrDefault("task_code", "");
                    LocalDate dueDate = ((java.sql.Date) row.get("due_date")).toLocalDate();
                    long overdueDays = ChronoUnit.DAYS.between(dueDate, today);

                    // Email notification
                    if (email != null && !email.isBlank()) {
                        emailService.sendEmailAsync(
                                email,
                                String.format("Задача \"%s\" просрочена", taskName),
                                "email/task-overdue",
                                Map.of(
                                        "taskName", taskName,
                                        "projectName", row.getOrDefault("project_name", ""),
                                        "dueDate", dueDate.format(DATE_FMT),
                                        "overdueDays", overdueDays,
                                        "assigneeName", row.getOrDefault("assignee_name", ""),
                                        "taskId", row.get("id").toString()
                                )
                        );
                    }

                    // In-app notification via WebSocket
                    UUID assigneeId = (UUID) row.get("assignee_id");
                    if (assigneeId != null) {
                        UUID taskId = (UUID) row.get("id");
                        String title = String.format("Просрочена: %s", taskName);
                        String message = String.format(
                                "Задача %s «%s» просрочена на %d дн. (срок: %s)",
                                taskCode, taskName, overdueDays, dueDate.format(DATE_FMT)
                        );

                        notificationService.send(
                                assigneeId,
                                title,
                                message,
                                NotificationType.WARNING,
                                "task",
                                taskId,
                                "/tasks?selected=" + taskId
                        );
                    }
                } catch (Exception e) {
                    log.error("[TaskOverdueCheckJob] Error processing task: {}", e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("[TaskOverdueCheckJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[TaskOverdueCheckJob] END - Completed in {} ms", elapsed);
    }
}
