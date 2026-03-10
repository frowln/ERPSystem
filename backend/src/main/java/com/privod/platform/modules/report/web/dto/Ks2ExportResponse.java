package com.privod.platform.modules.report.web.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Structured data for rendering a KS-2 document (Act of acceptance of completed works)
 * in the Russian standard print format.
 */
public record Ks2ExportResponse(
        String documentNumber,
        String documentDate,
        String projectName,
        String contractNumber,
        String contractDate,
        String contractorName,
        String contractorInn,
        String contractorAddress,
        String clientName,
        String clientInn,
        String clientAddress,
        String objectName,
        String reportingPeriodFrom,
        String reportingPeriodTo,
        List<Ks2ExportLineItem> items,
        BigDecimal totalAmount,
        BigDecimal vatRate,
        BigDecimal vatAmount,
        BigDecimal totalWithVat,
        String status,
        String statusDisplayName,
        String createdBy,
        String signedBy,
        String signedDate,
        String notes
) {
    public record Ks2ExportLineItem(
            int rowNumber,
            String name,
            String unitOfMeasure,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal amount
    ) {}
}
