package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Daily customer health score calculation for each organization.
 *
 * <p>Runs at 01:30 every day. For each active organization, computes three sub-scores:
 * <ul>
 *   <li><b>Engagement:</b> DAU / total users ratio (last 7 days average)</li>
 *   <li><b>Activity:</b> inversely proportional to days since last login</li>
 *   <li><b>Adoption:</b> distinct modules used / total available modules</li>
 * </ul>
 *
 * <p>Overall score = average of the three sub-scores. Risk level thresholds:
 * {@code >=70 LOW, >=40 MEDIUM, >=20 HIGH, <20 CRITICAL}.
 *
 * <p>Results are UPSERTed into {@code customer_health_scores}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CustomerHealthScoreJob {

    private final JdbcTemplate jdbcTemplate;

    /** Approximate total number of modules in the platform. */
    private static final int TOTAL_MODULES = 20;

    @Scheduled(cron = "0 30 1 * * *")
    public void calculateHealthScores() {
        long start = System.currentTimeMillis();
        log.info("[CustomerHealthScoreJob] START - Calculating customer health scores");

        try {
            // Fetch all active organizations
            List<Map<String, Object>> organizations = jdbcTemplate.queryForList(
                    """
                    SELECT id FROM organizations
                     WHERE active = true AND deleted = false
                    """
            );

            int processed = 0;
            for (Map<String, Object> org : organizations) {
                UUID orgId = (UUID) org.get("id");
                try {
                    processOrganization(orgId);
                    processed++;
                } catch (Exception e) {
                    log.warn("[CustomerHealthScoreJob] Failed to process org {}: {}", orgId, e.getMessage());
                }
            }

            log.info("[CustomerHealthScoreJob] Processed {} organizations", processed);

        } catch (Exception e) {
            log.error("[CustomerHealthScoreJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[CustomerHealthScoreJob] END - Completed in {} ms", elapsed);
    }

    private void processOrganization(UUID orgId) {
        // Total users in org
        Integer totalUsers = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE organization_id = ? AND deleted = false",
                Integer.class, orgId
        );
        totalUsers = totalUsers != null ? totalUsers : 0;

        // Active users in last 30 days
        Integer activeUsers30d = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(DISTINCT user_id)
                  FROM login_audit_logs
                 WHERE organization_id = ?
                   AND created_at >= NOW() - INTERVAL '30 days'
                """,
                Integer.class, orgId
        );
        activeUsers30d = activeUsers30d != null ? activeUsers30d : 0;

        // Days since last login
        Integer daysSinceLogin = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(
                    EXTRACT(DAY FROM NOW() - MAX(created_at))::integer, 999
                )
                FROM login_audit_logs
                WHERE organization_id = ?
                """,
                Integer.class, orgId
        );
        daysSinceLogin = daysSinceLogin != null ? daysSinceLogin : 999;

        // Projects count
        Integer projectsCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM projects WHERE organization_id = ? AND deleted = false",
                Integer.class, orgId
        );
        projectsCount = projectsCount != null ? projectsCount : 0;

        // Distinct modules used (from page_view_events in last 30 days)
        Integer modulesUsed = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(DISTINCT module_name)
                  FROM page_view_events
                 WHERE organization_id = ?
                   AND created_at >= NOW() - INTERVAL '30 days'
                   AND module_name IS NOT NULL
                """,
                Integer.class, orgId
        );
        modulesUsed = modulesUsed != null ? modulesUsed : 0;

        // Calculate sub-scores
        int engagementScore = totalUsers > 0
                ? Math.min(100, (int) ((double) activeUsers30d / totalUsers * 100))
                : 0;

        int activityScore;
        if (daysSinceLogin <= 0) activityScore = 100;
        else if (daysSinceLogin <= 3) activityScore = 80;
        else if (daysSinceLogin <= 7) activityScore = 50;
        else if (daysSinceLogin <= 14) activityScore = 20;
        else activityScore = 0;

        int adoptionScore = Math.min(100, (int) ((double) modulesUsed / TOTAL_MODULES * 100));

        int overallScore = (engagementScore + activityScore + adoptionScore) / 3;

        String riskLevel;
        if (overallScore >= 70) riskLevel = "LOW";
        else if (overallScore >= 40) riskLevel = "MEDIUM";
        else if (overallScore >= 20) riskLevel = "HIGH";
        else riskLevel = "CRITICAL";

        // UPSERT into customer_health_scores
        jdbcTemplate.update(
                """
                INSERT INTO customer_health_scores
                       (id, organization_id, overall_score, engagement_score, activity_score,
                        adoption_score, risk_level, last_login_at, days_since_login,
                        total_users, active_users_30d, projects_count, updated_at)
                VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, ?,
                        (SELECT MAX(created_at) FROM login_audit_logs WHERE organization_id = ?),
                        ?, ?, ?, ?, NOW())
                ON CONFLICT (organization_id) DO UPDATE SET
                    overall_score = EXCLUDED.overall_score,
                    engagement_score = EXCLUDED.engagement_score,
                    activity_score = EXCLUDED.activity_score,
                    adoption_score = EXCLUDED.adoption_score,
                    risk_level = EXCLUDED.risk_level,
                    last_login_at = EXCLUDED.last_login_at,
                    days_since_login = EXCLUDED.days_since_login,
                    total_users = EXCLUDED.total_users,
                    active_users_30d = EXCLUDED.active_users_30d,
                    projects_count = EXCLUDED.projects_count,
                    updated_at = NOW()
                """,
                orgId, overallScore, engagementScore, activityScore,
                adoptionScore, riskLevel,
                orgId,
                daysSinceLogin, totalUsers, activeUsers30d, projectsCount
        );

        log.debug("[CustomerHealthScoreJob] Org {} — overall={}, engagement={}, activity={}, adoption={}, risk={}",
                orgId, overallScore, engagementScore, activityScore, adoptionScore, riskLevel);
    }
}
