package com.privod.platform.modules.analytics.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.analytics.service.AnalyticsSavedReportService;
import com.privod.platform.modules.analytics.web.dto.CreateReportRequest;
import com.privod.platform.modules.analytics.web.dto.ExecuteReportRequest;
import com.privod.platform.modules.analytics.web.dto.ReportExecutionResponse;
import com.privod.platform.modules.analytics.web.dto.SavedReportResponse;
import com.privod.platform.modules.analytics.web.dto.UpdateReportRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics/reports")
@RequiredArgsConstructor
@Tag(name = "Analytics Reports", description = "Report management and execution endpoints")
public class AnalyticsReportController {

    private final AnalyticsSavedReportService reportService;

    @GetMapping
    @Operation(summary = "List all reports with pagination")
    public ResponseEntity<ApiResponse<PageResponse<SavedReportResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SavedReportResponse> page = reportService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get report by ID")
    public ResponseEntity<ApiResponse<SavedReportResponse>> getById(@PathVariable UUID id) {
        SavedReportResponse response = reportService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get reports created by a specific user")
    public ResponseEntity<ApiResponse<PageResponse<SavedReportResponse>>> getMyReports(
            @RequestParam UUID createdById,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SavedReportResponse> page = reportService.findByCreator(createdById, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/scheduled")
    @Operation(summary = "Get all scheduled reports")
    public ResponseEntity<ApiResponse<List<SavedReportResponse>>> getScheduledReports() {
        List<SavedReportResponse> reports = reportService.getScheduledReports();
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new report")
    public ResponseEntity<ApiResponse<SavedReportResponse>> create(
            @Valid @RequestBody CreateReportRequest request) {
        SavedReportResponse response = reportService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing report")
    public ResponseEntity<ApiResponse<SavedReportResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReportRequest request) {
        SavedReportResponse response = reportService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/execute")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Execute a report and generate output")
    public ResponseEntity<ApiResponse<ReportExecutionResponse>> execute(
            @PathVariable UUID id,
            @Valid @RequestBody ExecuteReportRequest request) {
        ReportExecutionResponse response = reportService.executeReport(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Schedule a report for periodic execution")
    public ResponseEntity<ApiResponse<SavedReportResponse>> schedule(
            @PathVariable UUID id,
            @RequestParam String cronExpression,
            @RequestParam(required = false) String recipients) {
        SavedReportResponse response = reportService.scheduleReport(id, cronExpression, recipients);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/executions")
    @Operation(summary = "Get execution history for a report")
    public ResponseEntity<ApiResponse<PageResponse<ReportExecutionResponse>>> getExecutionHistory(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReportExecutionResponse> page = reportService.getExecutionHistory(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a report (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        reportService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
