package com.privod.platform.modules.report.web.dto;

import java.math.BigDecimal;

/**
 * Structured data for rendering an Invoice for print/export.
 */
public record InvoiceExportResponse(
        String id,
        String number,
        String invoiceDate,
        String dueDate,
        String projectName,
        String partnerName,
        String invoiceType,
        String invoiceTypeDisplayName,
        String status,
        String statusDisplayName,
        BigDecimal subtotal,
        BigDecimal vatRate,
        BigDecimal vatAmount,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal remainingAmount,
        boolean overdue,
        String notes,
        String createdBy,
        String createdAt
) {}
