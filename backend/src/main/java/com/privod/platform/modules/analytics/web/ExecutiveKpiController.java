package com.privod.platform.modules.analytics.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.analytics.service.ExecutiveKpiService;
import com.privod.platform.modules.analytics.web.dto.CashPositionDto;
import com.privod.platform.modules.analytics.web.dto.ExecutiveDashboardResponse;
import com.privod.platform.modules.analytics.web.dto.PortfolioSummaryDto;
import com.privod.platform.modules.analytics.web.dto.ProjectDrillDownResponse;
import com.privod.platform.modules.analytics.web.dto.ProjectHealthDto;
import com.privod.platform.modules.analytics.web.dto.ResourceUtilizationDto;
import com.privod.platform.modules.analytics.web.dto.SafetyMetricsDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics/executive")
@RequiredArgsConstructor
@Tag(name = "Executive KPI", description = "Executive KPI rollup dashboard endpoints")
@PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE', 'PROJECT_MANAGER')")
public class ExecutiveKpiController {

    private final ExecutiveKpiService executiveKpiService;

    @GetMapping("/dashboard")
    @Operation(summary = "Full executive dashboard with all KPI sections")
    public ResponseEntity<ApiResponse<ExecutiveDashboardResponse>> getDashboard() {
        ExecutiveDashboardResponse response = executiveKpiService.getExecutiveDashboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/portfolio-summary")
    @Operation(summary = "Portfolio financial summary across all projects")
    public ResponseEntity<ApiResponse<PortfolioSummaryDto>> getPortfolioSummary() {
        PortfolioSummaryDto response = executiveKpiService.getPortfolioSummary();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/project-health")
    @Operation(summary = "Project health metrics with CPI/SPI for each project")
    public ResponseEntity<ApiResponse<List<ProjectHealthDto>>> getProjectHealth() {
        List<ProjectHealthDto> response = executiveKpiService.getProjectHealthMetrics();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/cash-position")
    @Operation(summary = "Cash position with accounts receivable aging buckets")
    public ResponseEntity<ApiResponse<CashPositionDto>> getCashPosition() {
        CashPositionDto response = executiveKpiService.getCashPosition();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/safety-metrics")
    @Operation(summary = "Safety KPIs: TRIR, incidents, severity breakdown")
    public ResponseEntity<ApiResponse<SafetyMetricsDto>> getSafetyMetrics() {
        SafetyMetricsDto response = executiveKpiService.getSafetyMetrics();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/resource-utilization")
    @Operation(summary = "Resource utilization: workers and equipment allocation")
    public ResponseEntity<ApiResponse<ResourceUtilizationDto>> getResourceUtilization() {
        ResourceUtilizationDto response = executiveKpiService.getResourceUtilization();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/project/{projectId}/drilldown")
    @Operation(summary = "Project drill-down with budget items, transactions, and EVM history")
    public ResponseEntity<ApiResponse<ProjectDrillDownResponse>> getProjectDrillDown(
            @PathVariable UUID projectId) {
        ProjectDrillDownResponse response = executiveKpiService.getProjectDrillDown(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
