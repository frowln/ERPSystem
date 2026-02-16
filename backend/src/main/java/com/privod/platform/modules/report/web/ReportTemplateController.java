package com.privod.platform.modules.report.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.report.service.ReportService;
import com.privod.platform.modules.report.web.dto.CreateReportTemplateRequest;
import com.privod.platform.modules.report.web.dto.GenerateReportRequest;
import com.privod.platform.modules.report.web.dto.GeneratedReportResponse;
import com.privod.platform.modules.report.web.dto.PrintFormResponse;
import com.privod.platform.modules.report.web.dto.ReportTemplateResponse;
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
@RequestMapping("/api/report-templates")
@RequiredArgsConstructor
@Tag(name = "Report Templates", description = "PDF report generation and template management")
public class ReportTemplateController {

    private final ReportService reportService;

    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Create a report template")
    public ResponseEntity<ApiResponse<ReportTemplateResponse>> createTemplate(
            @Valid @RequestBody CreateReportTemplateRequest request) {
        ReportTemplateResponse response = reportService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/templates")
    @Operation(summary = "List report templates")
    public ResponseEntity<ApiResponse<PageResponse<ReportTemplateResponse>>> listTemplates(
            @RequestParam(required = false) String reportType,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<ReportTemplateResponse> page = reportService.getTemplates(reportType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/templates/{code}")
    @Operation(summary = "Get a report template by code")
    public ResponseEntity<ApiResponse<ReportTemplateResponse>> getTemplate(@PathVariable String code) {
        ReportTemplateResponse response = reportService.getTemplate(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/templates/{code}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Update a report template")
    public ResponseEntity<ApiResponse<ReportTemplateResponse>> updateTemplate(
            @PathVariable String code,
            @Valid @RequestBody CreateReportTemplateRequest request) {
        ReportTemplateResponse response = reportService.updateTemplate(code, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/templates/{code}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete a report template (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable String code) {
        reportService.deleteTemplate(code);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate a PDF report")
    public ResponseEntity<ApiResponse<GeneratedReportResponse>> generate(
            @Valid @RequestBody GenerateReportRequest request) {
        GeneratedReportResponse response = reportService.generateReport(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/generated")
    @Operation(summary = "List generated reports for an entity")
    public ResponseEntity<ApiResponse<PageResponse<GeneratedReportResponse>>> listGenerated(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @PageableDefault(size = 20, sort = "generatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<GeneratedReportResponse> page = reportService.getGeneratedReports(
                entityType, entityId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/print-forms")
    @Operation(summary = "List available print forms for an entity type")
    public ResponseEntity<ApiResponse<List<PrintFormResponse>>> listPrintForms(
            @RequestParam String entityType) {
        List<PrintFormResponse> forms = reportService.getPrintForms(entityType);
        return ResponseEntity.ok(ApiResponse.ok(forms));
    }
}
