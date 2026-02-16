package com.privod.platform.modules.analytics.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.analytics.service.AnalyticsDataService;
import com.privod.platform.modules.analytics.web.dto.FinancialSummary;
import com.privod.platform.modules.analytics.web.dto.HrMetricsSummary;
import com.privod.platform.modules.analytics.web.dto.ProcurementStatusSummary;
import com.privod.platform.modules.analytics.web.dto.ProjectStatusSummary;
import com.privod.platform.modules.analytics.web.dto.ProjectTimelineEntry;
import com.privod.platform.modules.analytics.web.dto.SafetyMetricsSummary;
import com.privod.platform.modules.analytics.web.dto.TaskProgressSummary;
import com.privod.platform.modules.analytics.web.dto.WarehouseMetricsSummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Analytics data aggregation endpoints")
@PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER','FINANCE_MANAGER')")
public class AnalyticsController {

    private final AnalyticsDataService analyticsDataService;

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
}
