package com.privod.platform.modules.analytics.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.analytics.service.AnalyticsDataService;
import com.privod.platform.modules.analytics.service.DashboardAnalyticsService;
import com.privod.platform.modules.analytics.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Analytics data aggregation endpoints")
@PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER','FINANCE_MANAGER')")
public class AnalyticsController {

    private final AnalyticsDataService analyticsDataService;
    private final DashboardAnalyticsService dashboardAnalyticsService;

    @GetMapping("/project-status")
    @Operation(summary = "Get project status summary with counts by status")
    public ResponseEntity<ApiResponse<ProjectStatusSummary>> getProjectStatusSummary() {
        ProjectStatusSummary summary = analyticsDataService.getProjectStatusSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/financial-summary")
    @Operation(summary = "Get financial summary: revenue, costs, margin, cash flow")
    public ResponseEntity<ApiResponse<FinancialSummary>> getFinancialSummary(
            @RequestParam(required = false) UUID projectId) {
        FinancialSummary summary = analyticsDataService.getFinancialSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/safety-metrics")
    @Operation(summary = "Get safety metrics: incidents, inspections, violations")
    public ResponseEntity<ApiResponse<SafetyMetricsSummary>> getSafetyMetrics(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        SafetyMetricsSummary summary = analyticsDataService.getSafetyMetrics(projectId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/task-progress")
    @Operation(summary = "Get task progress: by status, by assignee, completion percent")
    public ResponseEntity<ApiResponse<TaskProgressSummary>> getTaskProgress(
            @RequestParam(required = false) UUID projectId) {
        TaskProgressSummary summary = analyticsDataService.getTaskProgress(projectId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/procurement-status")
    @Operation(summary = "Get procurement status: orders by status, spend analysis")
    public ResponseEntity<ApiResponse<ProcurementStatusSummary>> getProcurementStatus(
            @RequestParam(required = false) UUID projectId) {
        ProcurementStatusSummary summary = analyticsDataService.getProcurementStatus(projectId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/warehouse-metrics")
    @Operation(summary = "Get warehouse metrics: stock levels, movements, low stock")
    public ResponseEntity<ApiResponse<WarehouseMetricsSummary>> getWarehouseMetrics() {
        WarehouseMetricsSummary summary = analyticsDataService.getWarehouseMetrics();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/hr-metrics")
    @Operation(summary = "Get HR metrics: headcount, crew utilization, timesheet hours")
    public ResponseEntity<ApiResponse<HrMetricsSummary>> getHrMetrics() {
        HrMetricsSummary summary = analyticsDataService.getHrMetrics();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/timeline")
    @Operation(summary = "Get project timeline for Gantt chart display")
    public ResponseEntity<ApiResponse<List<ProjectTimelineEntry>>> getProjectTimeline() {
        List<ProjectTimelineEntry> timeline = analyticsDataService.getProjectTimeline();
        return ResponseEntity.ok(ApiResponse.ok(timeline));
    }

    // ---- Dashboard Analytics Endpoints ----

    @GetMapping("/dashboard")
    @Operation(summary = "Get organization-wide dashboard summary with key metrics")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrgDashboardResponse>> getOrgDashboard() {
        OrgDashboardResponse data = dashboardAnalyticsService.getOrganizationDashboard();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/dashboard/financial")
    @Operation(summary = "Get detailed financial summary: budget, spent, committed, forecast, monthly spend")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FinancialSummaryResponse>> getDashboardFinancialSummary() {
        FinancialSummaryResponse data = dashboardAnalyticsService.getFinancialSummary();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/dashboard/tasks")
    @Operation(summary = "Get task analytics: by status, priority, overdue count, completion rate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TaskAnalyticsResponse>> getDashboardTaskStats() {
        TaskAnalyticsResponse data = dashboardAnalyticsService.getTaskAnalytics();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/dashboard/safety")
    @Operation(summary = "Get safety metrics: inspections, violations, incidents, training compliance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SafetyMetricsResponse>> getDashboardSafetyMetrics() {
        SafetyMetricsResponse data = dashboardAnalyticsService.getSafetyMetrics();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // ---- Frontend Analytics Chart Endpoints ----

    @GetMapping("/financial")
    @Operation(summary = "Get monthly financial bars: revenue, cost, profit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<FinancialBarResponse>>> getFinancialBars(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        List<FinancialBarResponse> data = analyticsDataService.getFinancialBars();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/safety")
    @Operation(summary = "Get monthly safety metrics: incidents, near misses, inspections")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<SafetyMetricResponse>>> getSafetyMetricsList(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        List<SafetyMetricResponse> data = analyticsDataService.getSafetyMetricsList();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/procurement-spend")
    @Operation(summary = "Get procurement spend breakdown by category")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ProcurementSpendResponse>>> getProcurementSpend(
            @RequestParam(required = false) UUID projectId) {
        List<ProcurementSpendResponse> data = analyticsDataService.getProcurementSpendList();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/warehouse-stock")
    @Operation(summary = "Get warehouse stock levels by material category")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<WarehouseStockResponse>>> getWarehouseStock() {
        List<WarehouseStockResponse> data = analyticsDataService.getWarehouseStockList();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/kpis")
    @Operation(summary = "Get key performance indicators")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<KpiItemResponse>>> getKpis(
            @RequestParam(required = false) UUID projectId) {
        List<KpiItemResponse> data = analyticsDataService.getKpiItems();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/audit-log")
    @Operation(summary = "Get paginated audit log entries")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AuditLogPageResponse>> getAuditLog(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        AuditLogPageResponse data = analyticsDataService.getAuditLog(page, size);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/project-budgets")
    @Operation(summary = "Get project budget summaries: name, budget, actual")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ProjectBudgetSummaryResponse>>> getProjectBudgets(
            @RequestParam(required = false) UUID projectId) {
        List<ProjectBudgetSummaryResponse> data = analyticsDataService.getProjectBudgetSummaries();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/progress")
    @Operation(summary = "Get cumulative progress data: planned vs actual by month")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ProgressPointResponse>>> getProgress(
            @RequestParam(required = false) UUID projectId) {
        List<ProgressPointResponse> data = analyticsDataService.getProgressData();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/budget-categories")
    @Operation(summary = "Get budget breakdown by category")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<BudgetCategoryResponse>>> getBudgetCategories(
            @RequestParam(required = false) UUID projectId) {
        List<BudgetCategoryResponse> data = analyticsDataService.getBudgetCategoryBreakdown();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/export/{reportType}")
    @Operation(summary = "Export report data as CSV")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable String reportType,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false, defaultValue = "csv") String format) {

        byte[] data = analyticsDataService.exportReportData(reportType, projectId, dateFrom, dateTo, format);

        String contentType;
        String extension;
        switch (format != null ? format.toLowerCase() : "csv") {
            case "pdf" -> {
                contentType = "application/pdf";
                extension = "pdf";
            }
            case "xlsx" -> {
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                extension = "xlsx";
            }
            default -> {
                contentType = "text/csv; charset=UTF-8";
                extension = "csv";
            }
        }
        String filename = reportType + "-report." + extension;

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Content-Type", contentType)
                .contentLength(data.length)
                .body(data);
    }
}
