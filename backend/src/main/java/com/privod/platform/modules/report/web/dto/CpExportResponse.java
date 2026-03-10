package com.privod.platform.modules.report.web.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Structured data for rendering a Commercial Proposal (KP) for print/export.
 */
public record CpExportResponse(
        String id,
        String name,
        String projectName,
        String budgetName,
        String status,
        String statusDisplayName,
        String companyName,
        String companyInn,
        String companyKpp,
        String companyAddress,
        String signatoryName,
        String signatoryPosition,
        String createdAt,
        String approvedAt,
        String notes,
        BigDecimal totalCostPrice,
        BigDecimal totalCustomerPrice,
        BigDecimal totalMargin,
        BigDecimal marginPercent,
        List<CpExportItem> materialItems,
        List<CpExportItem> workItems
) {
    public record CpExportItem(
            int rowNumber,
            String name,
            String unitOfMeasure,
            BigDecimal quantity,
            BigDecimal costPrice,
            BigDecimal customerPrice,
            BigDecimal totalCost,
            BigDecimal totalCustomer,
            String notes,
            String status
    ) {}
}
