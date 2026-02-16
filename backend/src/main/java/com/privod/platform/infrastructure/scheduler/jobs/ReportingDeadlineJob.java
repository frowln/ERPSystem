package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Weekly check (Monday at 09:00) for approaching reporting deadlines.
 * Logs upcoming reports that need to be submitted.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ReportingDeadlineJob {

    private final JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 9 * * MON")
    public void checkReportingDeadlines() {
        long start = System.currentTimeMillis();
        log.info("[ReportingDeadlineJob] START - Weekly check for approaching reporting deadlines");

        try {
            LocalDate today = LocalDate.now();
            LocalDate weekEnd = today.plusDays(7);

            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT rd.id, rd.report_type, rd.deadline_date, rd.description,
                           p.name AS project_name,
                           u.full_name AS responsible_name
                    FROM reporting_deadlines rd
                    LEFT JOIN projects p ON p.id = rd.project_id
                    LEFT JOIN users u ON u.id = rd.responsible_id
                    WHERE rd.deleted = false
                      AND rd.status = 'PENDING'
                      AND rd.deadline_date BETWEEN ? AND ?
                    ORDER BY rd.deadline_date ASC
                    """,
                    today, weekEnd
            );

            log.info("[ReportingDeadlineJob] Found {} reporting deadlines this week", rows.size());

            for (var row : rows) {
                String reportType = (String) row.getOrDefault("report_type", "");
                String projectName = (String) row.getOrDefault("project_name", "");
                Object deadlineObj = row.get("deadline_date");
                String deadline = deadlineObj != null
                        ? ((java.sql.Date) deadlineObj).toLocalDate().format(DATE_FMT) : "N/A";
                String responsible = (String) row.getOrDefault("responsible_name", "не назначен");

                log.warn("[ReportingDeadlineJob] Upcoming deadline: type={}, project={}, deadline={}, responsible={}",
                        reportType, projectName, deadline, responsible);
            }

        } catch (Exception e) {
            log.error("[ReportingDeadlineJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[ReportingDeadlineJob] END - Completed in {} ms", elapsed);
    }
}
