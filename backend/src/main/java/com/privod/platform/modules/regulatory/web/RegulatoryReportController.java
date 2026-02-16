package com.privod.platform.modules.regulatory.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.regulatory.service.RegulatoryReportService;
import com.privod.platform.modules.regulatory.web.dto.CreateRegulatoryReportRequest;
import com.privod.platform.modules.regulatory.web.dto.RegulatoryReportResponse;
import com.privod.platform.modules.regulatory.web.dto.UpdateRegulatoryReportRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/regulatory/reports")
@RequiredArgsConstructor
@Tag(name = "Regulatory Reports", description = "Regulatory report management endpoints")
public class RegulatoryReportController {

    private final RegulatoryReportService reportService;

    @GetMapping
    @Operation(summary = "List regulatory reports with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<RegulatoryReportResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<RegulatoryReportResponse> page = reportService.listReports(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get regulatory report by ID")
    public ResponseEntity<ApiResponse<RegulatoryReportResponse>> getById(@PathVariable UUID id) {
        RegulatoryReportResponse response = reportService.getReport(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'REGULATORY_MANAGER')")
    @Operation(summary = "Create a new regulatory report")
    public ResponseEntity<ApiResponse<RegulatoryReportResponse>> create(
            @Valid @RequestBody CreateRegulatoryReportRequest request) {
        RegulatoryReportResponse response = reportService.createReport(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'REGULATORY_MANAGER')")
    @Operation(summary = "Update a regulatory report")
    public ResponseEntity<ApiResponse<RegulatoryReportResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRegulatoryReportRequest request) {
        RegulatoryReportResponse response = reportService.updateReport(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Submit a regulatory report")
    public ResponseEntity<ApiResponse<RegulatoryReportResponse>> submit(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID submittedById) {
        RegulatoryReportResponse response = reportService.submitReport(id, submittedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Accept a submitted regulatory report")
    public ResponseEntity<ApiResponse<RegulatoryReportResponse>> accept(@PathVariable UUID id) {
        RegulatoryReportResponse response = reportService.acceptReport(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Reject a submitted regulatory report")
    public ResponseEntity<ApiResponse<RegulatoryReportResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String reason) {
        RegulatoryReportResponse response = reportService.rejectReport(id, reason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Delete a regulatory report (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        reportService.deleteReport(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
