package com.privod.platform.modules.report.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.report.service.DocumentExportService;
import com.privod.platform.modules.report.web.dto.EstimateExportResponse;
import com.privod.platform.modules.report.web.dto.InvoiceExportResponse;
import com.privod.platform.modules.report.web.dto.Ks2ExportResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Tag(name = "Document Export", description = "Structured data export for document print/PDF rendering")
public class ExportController {

    private final DocumentExportService documentExportService;

    @GetMapping("/ks2/{id}/data")
    @Operation(summary = "Get KS-2 document data for print/PDF rendering")
    public ResponseEntity<ApiResponse<Ks2ExportResponse>> getKs2ExportData(@PathVariable UUID id) {
        Ks2ExportResponse response = documentExportService.getKs2ExportData(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/estimate/{id}/data")
    @Operation(summary = "Get Estimate data for print/PDF rendering")
    public ResponseEntity<ApiResponse<EstimateExportResponse>> getEstimateExportData(@PathVariable UUID id) {
        EstimateExportResponse response = documentExportService.getEstimateExportData(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/invoice/{id}/data")
    @Operation(summary = "Get Invoice data for print/PDF rendering")
    public ResponseEntity<ApiResponse<InvoiceExportResponse>> getInvoiceExportData(@PathVariable UUID id) {
        InvoiceExportResponse response = documentExportService.getInvoiceExportData(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
