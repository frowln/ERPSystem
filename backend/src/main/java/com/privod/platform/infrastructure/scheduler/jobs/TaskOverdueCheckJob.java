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
 * Marks overdue tasks and notifies responsible persons every weekday at 08:30.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class TaskOverdueCheckJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

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
                    SELECT t.id, t.name AS task_name, t.due_date,
                           p.name AS project_name,
                           u.email AS assignee_email, u.full_name AS assignee_name
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
                    if (email == null || email.isBlank()) {
                        continue;
                    }

                    String taskName = (String) row.getOrDefault("task_name", "");
                    LocalDate dueDate = ((java.sql.Date) row.get("due_date")).toLocalDate();
                    long overdueDays = ChronoUnit.DAYS.between(dueDate, today);

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
