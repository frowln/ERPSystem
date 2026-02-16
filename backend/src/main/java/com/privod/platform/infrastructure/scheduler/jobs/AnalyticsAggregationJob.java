package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Nightly analytics data aggregation at 02:00.
 * Computes and stores daily project metrics, cost summaries,
 * and performance indicators for dashboard consumption.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class AnalyticsAggregationJob {

    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 2 * * *")
    public void aggregateAnalytics() {
        long start = System.currentTimeMillis();
        log.info("[AnalyticsAggregationJob] START - Nightly analytics aggregation");

        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);

            // Aggregate project-level daily metrics
            int projectMetrics = jdbcTemplate.update(
                    """
                    INSERT INTO project_daily_metrics (id, project_id, metric_date,
                        tasks_completed, tasks_created, tasks_overdue,
                        issues_opened, issues_resolved,
                        created_at, updated_at, deleted, version)
                    SELECT
                        uuid_generate_v4(),
                        p.id,
                        ?,
                        COALESCE((SELECT COUNT(*) FROM tasks t
                                  WHERE t.project_id = p.id AND t.completed_at::date = ? AND t.deleted = false), 0),
                        COALESCE((SELECT COUNT(*) FROM tasks t
                                  WHERE t.project_id = p.id AND t.created_at::date = ? AND t.deleted = false), 0),
                        COALESCE((SELECT COUNT(*) FROM tasks t
                                  WHERE t.project_id = p.id AND t.status = 'OVERDUE' AND t.deleted = false), 0),
                        COALESCE((SELECT COUNT(*) FROM issues i
                                  WHERE i.project_id = p.id AND i.created_at::date = ? AND i.deleted = false), 0),
                        COALESCE((SELECT COUNT(*) FROM issues i
                                  WHERE i.project_id = p.id AND i.resolved_at::date = ? AND i.deleted = false), 0),
                        NOW(), NOW(), false, 0
                    FROM projects p
                    WHERE p.deleted = false AND p.status = 'ACTIVE'
                    ON CONFLICT (project_id, metric_date) DO UPDATE SET
                        tasks_completed = EXCLUDED.tasks_completed,
                        tasks_created = EXCLUDED.tasks_created,
                        tasks_overdue = EXCLUDED.tasks_overdue,
                        issues_opened = EXCLUDED.issues_opened,
                        issues_resolved = EXCLUDED.issues_resolved,
                        updated_at = NOW()
                    """,
                    yesterday, yesterday, yesterday, yesterday, yesterday
            );
            log.info("[AnalyticsAggregationJob] Aggregated metrics for {} projects", projectMetrics);

            // Aggregate cost summaries
            int costSummaries = jdbcTemplate.update(
                    """
                    INSERT INTO daily_cost_summaries (id, project_id, summary_date,
                        total_expenses, labor_cost, material_cost, equipment_cost,
                        created_at, updated_at, deleted, version)
                    SELECT
                        uuid_generate_v4(),
                        p.id,
                        ?,
                        COALESCE(SUM(e.amount), 0),
                        COALESCE(SUM(CASE WHEN e.expense_type = 'LABOR' THEN e.amount ELSE 0 END), 0),
                        COALESCE(SUM(CASE WHEN e.expense_type = 'MATERIAL' THEN e.amount ELSE 0 END), 0),
                        COALESCE(SUM(CASE WHEN e.expense_type = 'EQUIPMENT' THEN e.amount ELSE 0 END), 0),
                        NOW(), NOW(), false, 0
                    FROM projects p
                    LEFT JOIN expenses e ON e.project_id = p.id
                        AND e.expense_date = ? AND e.deleted = false
                    WHERE p.deleted = false AND p.status = 'ACTIVE'
                    GROUP BY p.id
                    ON CONFLICT (project_id, summary_date) DO UPDATE SET
                        total_expenses = EXCLUDED.total_expenses,
                        labor_cost = EXCLUDED.labor_cost,
                        material_cost = EXCLUDED.material_cost,
                        equipment_cost = EXCLUDED.equipment_cost,
                        updated_at = NOW()
                    """,
                    yesterday, yesterday
            );
            log.info("[AnalyticsAggregationJob] Aggregated cost summaries for {} projects", costSummaries);

        } catch (Exception e) {
            log.error("[AnalyticsAggregationJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[AnalyticsAggregationJob] END - Completed in {} ms", elapsed);
    }
}
