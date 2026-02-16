package com.privod.platform.infrastructure.report;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for downloading pre-formatted PDF reports.
 * <p>
 * Each endpoint renders a Thymeleaf template via {@link PdfReportService}
 * and returns the PDF as an inline or attachment byte stream.
 */
@RestController
@RequestMapping("/api/pdf-reports")
@RequiredArgsConstructor
@Tag(name = "PDF Reports", description = "Download pre-formatted PDF reports for construction documents")
public class PdfReportController {

    private final PdfReportService pdfReportService;

    @GetMapping("/ks2/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Download KS-2 report (Act of Completed Works)")
    public ResponseEntity<byte[]> downloadKs2Report(@PathVariable UUID id) {
        byte[] pdf = pdfReportService.generateKs2Report(id);
        return pdfResponse(pdf, "ks2-report-" + id + ".pdf");
    }

    @GetMapping("/ks3/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Download KS-3 report (Cost Certificate)")
    public ResponseEntity<byte[]> downloadKs3Report(@PathVariable UUID id) {
        byte[] pdf = pdfReportService.generateKs3Report(id);
        return pdfResponse(pdf, "ks3-report-" + id + ".pdf");
    }

    @GetMapping("/project/{id}/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Download project summary report")
    public ResponseEntity<byte[]> downloadProjectSummary(@PathVariable UUID id) {
        byte[] pdf = pdfReportService.generateProjectSummary(id);
        return pdfResponse(pdf, "project-summary-" + id + ".pdf");
    }

    @GetMapping("/safety/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SAFETY_OFFICER')")
    @Operation(summary = "Download safety inspection report")
    public ResponseEntity<byte[]> downloadSafetyReport(@PathVariable UUID id) {
        byte[] pdf = pdfReportService.generateSafetyReport(id);
        return pdfResponse(pdf, "safety-inspection-" + id + ".pdf");
    }

    @GetMapping("/daily-log/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Download daily construction log report")
    public ResponseEntity<byte[]> downloadDailyLogReport(@PathVariable UUID id) {
        byte[] pdf = pdfReportService.generateDailyLogReport(id);
        return pdfResponse(pdf, "daily-log-" + id + ".pdf");
    }

    /**
     * Build a ResponseEntity for a PDF byte array with proper content headers.
     */
    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .body(pdf);
    }
}
