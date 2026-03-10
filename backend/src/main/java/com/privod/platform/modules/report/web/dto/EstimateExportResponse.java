package com.privod.platform.modules.report.web.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Structured data for rendering an Estimate document for print/export.
 */
public record EstimateExportResponse(
        String id,
        String name,
        String projectName,
        String contractNumber,
        String status,
        String statusDisplayName,
        BigDecimal totalAmount,
        BigDecimal orderedAmount,
        BigDecimal invoicedAmount,
        BigDecimal totalSpent,
        BigDecimal balance,
        String createdBy,
        String createdAt,
        String notes,
        List<EstimateExportItem> items
) {
    public record EstimateExportItem(
            int rowNumber,
            String name,
            String unitOfMeasure,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal amount,
            BigDecimal unitPriceCustomer,
            BigDecimal amountCustomer,
            BigDecimal orderedAmount,
            BigDecimal invoicedAmount
    ) {}
}
