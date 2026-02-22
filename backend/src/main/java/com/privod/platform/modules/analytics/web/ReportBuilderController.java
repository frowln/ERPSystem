package com.privod.platform.modules.analytics.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.analytics.domain.ReportDataSource;
import com.privod.platform.modules.analytics.service.ReportBuilderService;
import com.privod.platform.modules.analytics.web.dto.CreateReportTemplateRequest;
import com.privod.platform.modules.analytics.web.dto.DataSourceInfo;
import com.privod.platform.modules.analytics.web.dto.ExecuteReportBuilderRequest;
import com.privod.platform.modules.analytics.web.dto.FieldInfo;
import com.privod.platform.modules.analytics.web.dto.ReportBuilderExecutionResponse;
import com.privod.platform.modules.analytics.web.dto.ReportTemplateResponse;
import com.privod.platform.modules.analytics.web.dto.UpdateReportTemplateRequest;
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
@RequestMapping("/api/analytics/report-builder")
@RequiredArgsConstructor
@Tag(name = "Report Builder", description = "Visual report builder with drag-drop fields, filters, grouping, and charts")
public class ReportBuilderController {

    private final ReportBuilderService reportBuilderService;

    @GetMapping("/templates")
    @Operation(summary = "List report templates for current user (public + own)")
    public ResponseEntity<ApiResponse<PageResponse<ReportTemplateResponse>>> listTemplates(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReportTemplateResponse> page = reportBuilderService.getTemplates(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/templates/{id}")
    @Operation(summary = "Get report template by ID")
    public ResponseEntity<ApiResponse<ReportTemplateResponse>> getTemplate(@PathVariable UUID id) {
        ReportTemplateResponse response = reportBuilderService.getTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new report template")
    public ResponseEntity<ApiResponse<ReportTemplateResponse>> createTemplate(
            @Valid @RequestBody CreateReportTemplateRequest request) {
        ReportTemplateResponse response = reportBuilderService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing report template")
    public ResponseEntity<ApiResponse<ReportTemplateResponse>> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReportTemplateRequest request) {
        ReportTemplateResponse response = reportBuilderService.updateTemplate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a report template (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID id) {
        reportBuilderService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/templates/{id}/duplicate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Duplicate (clone) a report template")
    public ResponseEntity<ApiResponse<ReportTemplateResponse>> duplicateTemplate(@PathVariable UUID id) {
        ReportTemplateResponse response = reportBuilderService.duplicateTemplate(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/templates/{id}/execute")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Execute a report template and return results")
    public ResponseEntity<ApiResponse<ReportBuilderExecutionResponse>> executeReport(
            @PathVariable UUID id,
            @RequestBody(required = false) ExecuteReportBuilderRequest request) {
        ReportBuilderExecutionResponse response = reportBuilderService.executeReport(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/templates/{id}/history")
    @Operation(summary = "Get execution history for a report template")
    public ResponseEntity<ApiResponse<PageResponse<ReportBuilderExecutionResponse>>> getExecutionHistory(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReportBuilderExecutionResponse> page = reportBuilderService.getExecutionHistory(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/data-sources")
    @Operation(summary = "List available data sources for report builder")
    public ResponseEntity<ApiResponse<List<DataSourceInfo>>> getDataSources() {
        List<DataSourceInfo> sources = reportBuilderService.getAvailableDataSources();
        return ResponseEntity.ok(ApiResponse.ok(sources));
    }

    @GetMapping("/data-sources/{source}/fields")
    @Operation(summary = "Get available fields for a specific data source")
    public ResponseEntity<ApiResponse<List<FieldInfo>>> getFieldsForDataSource(
            @PathVariable ReportDataSource source) {
        List<FieldInfo> fields = reportBuilderService.getAvailableFields(source);
        return ResponseEntity.ok(ApiResponse.ok(fields));
    }
}
