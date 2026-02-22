package com.privod.platform.modules.esg.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.esg.domain.EsgMaterialCategory;
import com.privod.platform.modules.esg.domain.EsgReportStatus;
import com.privod.platform.modules.esg.domain.EsgReportType;
import com.privod.platform.modules.esg.service.EsgService;
import com.privod.platform.modules.esg.web.dto.CalculateFootprintRequest;
import com.privod.platform.modules.esg.web.dto.CreateGwpEntryRequest;
import com.privod.platform.modules.esg.web.dto.EsgReportResponse;
import com.privod.platform.modules.esg.web.dto.GenerateEsgReportRequest;
import com.privod.platform.modules.esg.web.dto.MaterialGwpEntryResponse;
import com.privod.platform.modules.esg.web.dto.PortfolioEsgSummaryResponse;
import com.privod.platform.modules.esg.web.dto.ProjectCarbonFootprintResponse;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/esg")
@RequiredArgsConstructor
@Tag(name = "ESG & Carbon Tracking", description = "ESG carbon footprint calculation and reporting endpoints")
public class EsgController {

    private final EsgService esgService;

    // ---- GWP Database ----

    @GetMapping("/gwp")
    @Operation(summary = "List GWP entries with optional category filter")
    public ResponseEntity<ApiResponse<PageResponse<MaterialGwpEntryResponse>>> listGwpEntries(
            @RequestParam(required = false) EsgMaterialCategory category,
            @PageableDefault(size = 20, sort = "materialCategory", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<MaterialGwpEntryResponse> page = esgService.listGwpEntries(category, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/gwp/{id}")
    @Operation(summary = "Get GWP entry by ID")
    public ResponseEntity<ApiResponse<MaterialGwpEntryResponse>> getGwpEntry(@PathVariable UUID id) {
        MaterialGwpEntryResponse response = esgService.getGwpEntry(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/gwp")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a custom GWP entry")
    public ResponseEntity<ApiResponse<MaterialGwpEntryResponse>> createGwpEntry(
            @Valid @RequestBody CreateGwpEntryRequest request) {
        MaterialGwpEntryResponse response = esgService.createGwpEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/gwp/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete a GWP entry")
    public ResponseEntity<ApiResponse<Void>> deleteGwpEntry(@PathVariable UUID id) {
        esgService.deleteGwpEntry(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Carbon Footprint ----

    @PostMapping("/footprint/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Calculate carbon footprint for a project")
    public ResponseEntity<ApiResponse<ProjectCarbonFootprintResponse>> calculateFootprint(
            @Valid @RequestBody CalculateFootprintRequest request) {
        ProjectCarbonFootprintResponse response = esgService.calculateProjectFootprint(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/footprint/project/{projectId}")
    @Operation(summary = "Get latest carbon footprint for a project")
    public ResponseEntity<ApiResponse<ProjectCarbonFootprintResponse>> getProjectFootprint(
            @PathVariable UUID projectId) {
        ProjectCarbonFootprintResponse response = esgService.getProjectFootprint(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/footprint")
    @Operation(summary = "List all carbon footprint snapshots")
    public ResponseEntity<ApiResponse<PageResponse<ProjectCarbonFootprintResponse>>> listFootprints(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "calculatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ProjectCarbonFootprintResponse> page = esgService.listProjectFootprints(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ---- ESG Reports ----

    @PostMapping("/reports/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Generate an ESG report for a project")
    public ResponseEntity<ApiResponse<EsgReportResponse>> generateReport(
            @Valid @RequestBody GenerateEsgReportRequest request) {
        EsgReportResponse response = esgService.generateEsgReport(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/reports/{id}")
    @Operation(summary = "Get ESG report by ID")
    public ResponseEntity<ApiResponse<EsgReportResponse>> getReport(@PathVariable UUID id) {
        EsgReportResponse response = esgService.getEsgReport(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/reports")
    @Operation(summary = "List ESG reports with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<EsgReportResponse>>> listReports(
            @RequestParam(required = false) EsgReportType reportType,
            @RequestParam(required = false) EsgReportStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EsgReportResponse> page = esgService.listEsgReports(reportType, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/reports/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Approve an ESG report")
    public ResponseEntity<ApiResponse<EsgReportResponse>> approveReport(@PathVariable UUID id) {
        EsgReportResponse response = esgService.approveReport(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/reports/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete an ESG report")
    public ResponseEntity<ApiResponse<Void>> deleteReport(@PathVariable UUID id) {
        esgService.deleteEsgReport(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Portfolio Summary ----

    @GetMapping("/portfolio/summary")
    @Operation(summary = "Get aggregated ESG summary across all projects")
    public ResponseEntity<ApiResponse<PortfolioEsgSummaryResponse>> getPortfolioSummary() {
        PortfolioEsgSummaryResponse response = esgService.getPortfolioSummary();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
