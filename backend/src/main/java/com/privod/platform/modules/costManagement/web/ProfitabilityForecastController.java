package com.privod.platform.modules.costManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.costManagement.domain.ProfitabilityRiskLevel;
import com.privod.platform.modules.costManagement.service.ProfitabilityForecastService;
import com.privod.platform.modules.costManagement.web.dto.ProfitabilityForecastResponse;
import com.privod.platform.modules.costManagement.web.dto.ProfitabilityPortfolioResponse;
import com.privod.platform.modules.costManagement.web.dto.ProfitabilitySnapshotResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cost-management/profitability")
@RequiredArgsConstructor
@Tag(name = "Profitability Forecasting", description = "P3-11: Profitability forecasting and margin analysis")
public class ProfitabilityForecastController {

    private final ProfitabilityForecastService profitabilityForecastService;

    @GetMapping
    @Operation(summary = "List all profitability forecasts with pagination")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<ProfitabilityForecastResponse>>> list(
            @PageableDefault(size = 20, sort = "lastCalculatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ProfitabilityForecastResponse> page = profitabilityForecastService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get profitability forecast for a specific project")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ProfitabilityForecastResponse>> getByProject(
            @PathVariable UUID projectId) {
        ProfitabilityForecastResponse response = profitabilityForecastService.findByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/risk/{riskLevel}")
    @Operation(summary = "List profitability forecasts filtered by risk level")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<ProfitabilityForecastResponse>>> getByRiskLevel(
            @PathVariable ProfitabilityRiskLevel riskLevel,
            @PageableDefault(size = 20, sort = "forecastMargin", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<ProfitabilityForecastResponse> page = profitabilityForecastService.findByRiskLevel(riskLevel, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/recalculate/{projectId}")
    @Operation(summary = "Recalculate profitability forecast for a single project")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    public ResponseEntity<ApiResponse<ProfitabilityForecastResponse>> recalculate(
            @PathVariable UUID projectId) {
        ProfitabilityForecastResponse response = profitabilityForecastService.recalculate(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/recalculate-all")
    @Operation(summary = "Recalculate profitability forecasts for all active projects")
    @PreAuthorize("hasAnyRole('ADMIN', 'COST_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> recalculateAll() {
        profitabilityForecastService.recalculateAll();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/portfolio")
    @Operation(summary = "Get aggregated portfolio profitability summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ProfitabilityPortfolioResponse>> getPortfolioSummary() {
        ProfitabilityPortfolioResponse response = profitabilityForecastService.getPortfolioSummary();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/snapshots/{projectId}")
    @Operation(summary = "Get profitability snapshot time-series for a project")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<ProfitabilitySnapshotResponse>>> getSnapshots(
            @PathVariable UUID projectId) {
        List<ProfitabilitySnapshotResponse> snapshots = profitabilityForecastService.getSnapshots(projectId);
        return ResponseEntity.ok(ApiResponse.ok(snapshots));
    }

    @DeleteMapping("/project/{projectId}")
    @Operation(summary = "Soft-delete profitability forecast for a project")
    @PreAuthorize("hasAnyRole('ADMIN', 'COST_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteForProject(@PathVariable UUID projectId) {
        profitabilityForecastService.deleteForProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
