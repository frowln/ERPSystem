package com.privod.platform.modules.analytics.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.analytics.domain.KpiCategory;
import com.privod.platform.modules.analytics.service.KpiService;
import com.privod.platform.modules.analytics.web.dto.CreateKpiDefinitionRequest;
import com.privod.platform.modules.analytics.web.dto.KpiDashboardItem;
import com.privod.platform.modules.analytics.web.dto.KpiDefinitionResponse;
import com.privod.platform.modules.analytics.web.dto.KpiSnapshotResponse;
import com.privod.platform.modules.analytics.web.dto.TakeSnapshotRequest;
import com.privod.platform.modules.analytics.web.dto.UpdateKpiDefinitionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/kpis")
@RequiredArgsConstructor
@Tag(name = "KPIs", description = "KPI definition, snapshot, and dashboard endpoints")
public class KpiController {

    private final KpiService kpiService;

    // --- KPI Definition endpoints ---

    @GetMapping
    @Operation(summary = "List KPI definitions with optional category filter")
    public ResponseEntity<ApiResponse<PageResponse<KpiDefinitionResponse>>> list(
            @RequestParam(required = false) KpiCategory category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<KpiDefinitionResponse> page = kpiService.findAll(category, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get KPI definition by ID")
    public ResponseEntity<ApiResponse<KpiDefinitionResponse>> getById(@PathVariable UUID id) {
        KpiDefinitionResponse response = kpiService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active KPI definitions")
    public ResponseEntity<ApiResponse<List<KpiDefinitionResponse>>> getActiveKpis() {
        List<KpiDefinitionResponse> kpis = kpiService.getActiveKpis();
        return ResponseEntity.ok(ApiResponse.ok(kpis));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new KPI definition")
    public ResponseEntity<ApiResponse<KpiDefinitionResponse>> create(
            @Valid @RequestBody CreateKpiDefinitionRequest request) {
        KpiDefinitionResponse response = kpiService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing KPI definition")
    public ResponseEntity<ApiResponse<KpiDefinitionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateKpiDefinitionRequest request) {
        KpiDefinitionResponse response = kpiService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a KPI definition (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        kpiService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // --- KPI Snapshot endpoints ---

    @PostMapping("/{id}/snapshots")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Take a KPI snapshot (record current value)")
    public ResponseEntity<ApiResponse<KpiSnapshotResponse>> takeSnapshot(
            @PathVariable UUID id,
            @Valid @RequestBody TakeSnapshotRequest request) {
        KpiSnapshotResponse response = kpiService.takeSnapshot(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/snapshots")
    @Operation(summary = "Get snapshot history for a KPI with pagination")
    public ResponseEntity<ApiResponse<PageResponse<KpiSnapshotResponse>>> getKpiHistory(
            @PathVariable UUID id,
            @PageableDefault(size = 50, sort = "snapshotDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<KpiSnapshotResponse> page = kpiService.getKpiHistory(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}/snapshots/range")
    @Operation(summary = "Get KPI snapshots within a date range")
    public ResponseEntity<ApiResponse<List<KpiSnapshotResponse>>> getKpiHistoryByDateRange(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<KpiSnapshotResponse> snapshots = kpiService.getKpiHistoryByDateRange(id, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(snapshots));
    }

    @GetMapping("/{id}/calculate")
    @Operation(summary = "Calculate current KPI value")
    public ResponseEntity<ApiResponse<BigDecimal>> calculateKpi(@PathVariable UUID id) {
        BigDecimal value = kpiService.calculateKpi(id);
        return ResponseEntity.ok(ApiResponse.ok(value));
    }

    // --- KPI Dashboard ---

    @GetMapping("/dashboard")
    @Operation(summary = "Get KPI dashboard with all active KPIs and their latest values")
    public ResponseEntity<ApiResponse<List<KpiDashboardItem>>> getKpiDashboard() {
        List<KpiDashboardItem> dashboard = kpiService.getKpiDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }
}
