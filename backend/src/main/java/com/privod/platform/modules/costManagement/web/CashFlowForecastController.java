package com.privod.platform.modules.costManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.costManagement.service.CashFlowForecastEnhancedService;
import com.privod.platform.modules.costManagement.service.CashFlowForecastEnhancedService.VarianceSummary;
import com.privod.platform.modules.costManagement.web.dto.CashFlowForecastBucketResponse;
import com.privod.platform.modules.costManagement.web.dto.CashFlowScenarioResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCashFlowScenarioRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cost-management/cash-flow-forecast")
@RequiredArgsConstructor
@Tag(name = "Cash Flow Forecast", description = "Cash flow forecasting and scenario management")
public class CashFlowForecastController {

    private final CashFlowForecastEnhancedService cashFlowForecastService;

    @GetMapping("/scenarios")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "List all cash flow scenarios with pagination")
    public ResponseEntity<ApiResponse<PageResponse<CashFlowScenarioResponse>>> listScenarios(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CashFlowScenarioResponse> page = cashFlowForecastService.findAllScenarios(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/scenarios/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Get cash flow scenario by ID")
    public ResponseEntity<ApiResponse<CashFlowScenarioResponse>> getScenario(@PathVariable UUID id) {
        CashFlowScenarioResponse response = cashFlowForecastService.findScenarioById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/scenarios/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "List cash flow scenarios by project")
    public ResponseEntity<ApiResponse<List<CashFlowScenarioResponse>>> getScenariosByProject(
            @PathVariable UUID projectId) {
        List<CashFlowScenarioResponse> list = cashFlowForecastService.findScenariosByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/scenarios")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Create a new cash flow scenario")
    public ResponseEntity<ApiResponse<CashFlowScenarioResponse>> createScenario(
            @Valid @RequestBody CreateCashFlowScenarioRequest request) {
        CashFlowScenarioResponse response = cashFlowForecastService.createScenario(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/scenarios/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Update a cash flow scenario")
    public ResponseEntity<ApiResponse<CashFlowScenarioResponse>> updateScenario(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCashFlowScenarioRequest request) {
        CashFlowScenarioResponse response = cashFlowForecastService.updateScenario(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/scenarios/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a cash flow scenario (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteScenario(@PathVariable UUID id) {
        cashFlowForecastService.deleteScenario(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/scenarios/{id}/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Generate forecast buckets for a scenario")
    public ResponseEntity<ApiResponse<List<CashFlowForecastBucketResponse>>> generateForecast(
            @PathVariable UUID id) {
        List<CashFlowForecastBucketResponse> buckets = cashFlowForecastService.generateForecast(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(buckets));
    }

    @GetMapping("/scenarios/{id}/buckets")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Get forecast buckets for a scenario")
    public ResponseEntity<ApiResponse<List<CashFlowForecastBucketResponse>>> getForecastBuckets(
            @PathVariable UUID id) {
        List<CashFlowForecastBucketResponse> buckets = cashFlowForecastService.getForecastBuckets(id);
        return ResponseEntity.ok(ApiResponse.ok(buckets));
    }

    @GetMapping("/scenarios/{id}/variance")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Get variance summary for a scenario")
    public ResponseEntity<ApiResponse<VarianceSummary>> getVarianceSummary(@PathVariable UUID id) {
        VarianceSummary summary = cashFlowForecastService.getVarianceSummary(id);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
