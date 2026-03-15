package com.privod.platform.modules.analytics.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoints for page view tracking, DAU/MAU metrics, activation funnel,
 * module usage analytics, and customer health scores.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Page View Analytics", description = "Product analytics: page views, DAU/MAU, funnel, health scores")
public class PageViewController {

    private final JdbcTemplate jdbcTemplate;

    // -----------------------------------------------------------------------
    // POST /api/analytics/page-view — track page view (any authenticated user)
    // -----------------------------------------------------------------------

    @PostMapping("/page-view")
    @Operation(summary = "Record a page view event")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> recordPageView(@RequestBody PageViewRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        jdbcTemplate.update(
                """
                INSERT INTO page_view_events (id, user_id, organization_id, page_path, module_name, created_at)
                VALUES (gen_random_uuid(), ?, ?, ?, ?, NOW())
                """,
                userId, orgId, request.pagePath(), request.moduleName()
        );

        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // -----------------------------------------------------------------------
    // GET /api/analytics/module-usage — top modules by visit count (last 30d)
    // -----------------------------------------------------------------------

    @GetMapping("/module-usage")
    @Operation(summary = "Get top modules by visit count (last 30 days)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getModuleUsage() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<Map<String, Object>> result = jdbcTemplate.queryForList(
                """
                SELECT module_name, COUNT(*) AS visit_count
                  FROM page_view_events
                 WHERE organization_id = ?
                   AND created_at >= NOW() - INTERVAL '30 days'
                   AND module_name IS NOT NULL
                 GROUP BY module_name
                 ORDER BY visit_count DESC
                 LIMIT 30
                """,
                orgId
        );

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // -----------------------------------------------------------------------
    // GET /api/analytics/dau-mau — last 30 days DAU/MAU from usage_metrics
    // -----------------------------------------------------------------------

    @GetMapping("/dau-mau")
    @Operation(summary = "Get DAU/MAU metrics for the last 30 days")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDauMau() {
        List<Map<String, Object>> result = jdbcTemplate.queryForList(
                """
                SELECT metric_date, metric_type, metric_value
                  FROM usage_metrics
                 WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
                 ORDER BY metric_date DESC, metric_type
                """
        );

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // -----------------------------------------------------------------------
    // GET /api/analytics/activation-funnel — funnel counts
    // -----------------------------------------------------------------------

    @GetMapping("/activation-funnel")
    @Operation(summary = "Get activation funnel step counts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActivationFunnel() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<Map<String, Object>> result = jdbcTemplate.queryForList(
                """
                SELECT event_type, COUNT(DISTINCT user_id) AS user_count
                  FROM activation_events
                 WHERE organization_id = ?
                 GROUP BY event_type
                 ORDER BY
                   CASE event_type
                     WHEN 'REGISTERED' THEN 1
                     WHEN 'SETUP_COMPLETED' THEN 2
                     WHEN 'FIRST_PROJECT' THEN 3
                     WHEN 'FIRST_ESTIMATE' THEN 4
                     WHEN 'FIRST_KS2' THEN 5
                     ELSE 99
                   END
                """,
                orgId
        );

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // -----------------------------------------------------------------------
    // GET /api/analytics/health-scores — all customer health scores
    // -----------------------------------------------------------------------

    @GetMapping("/health-scores")
    @Operation(summary = "Get all customer health scores")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHealthScores() {
        List<Map<String, Object>> result = jdbcTemplate.queryForList(
                """
                SELECT chs.organization_id, o.name AS org_name,
                       chs.overall_score, chs.engagement_score, chs.activity_score,
                       chs.adoption_score, chs.risk_level, chs.last_login_at,
                       chs.days_since_login, chs.total_users, chs.active_users_30d,
                       chs.projects_count, chs.updated_at
                  FROM customer_health_scores chs
                  JOIN organizations o ON o.id = chs.organization_id AND o.deleted = false
                 ORDER BY chs.risk_level DESC, chs.overall_score ASC
                """
        );

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // -----------------------------------------------------------------------
    // GET /api/analytics/feature-adoption — role × module usage heatmap
    // -----------------------------------------------------------------------

    @GetMapping("/feature-adoption")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Feature adoption heatmap: role × module usage counts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFeatureAdoption() {
        List<Map<String, Object>> results = jdbcTemplate.queryForList("""
                SELECT u.role,
                       SPLIT_PART(p.page_path, '/', 2) AS module,
                       COUNT(*) AS view_count,
                       COUNT(DISTINCT p.user_id) AS unique_users
                FROM page_view_events p
                JOIN users u ON u.id = p.user_id
                WHERE p.created_at > NOW() - INTERVAL '30 days'
                GROUP BY u.role, SPLIT_PART(p.page_path, '/', 2)
                ORDER BY view_count DESC
                """);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    // -----------------------------------------------------------------------
    // DTO
    // -----------------------------------------------------------------------

    public record PageViewRequest(String pagePath, String moduleName) {}
}
