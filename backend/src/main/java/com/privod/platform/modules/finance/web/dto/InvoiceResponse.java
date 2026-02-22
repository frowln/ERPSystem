package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceMatchingStatus;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.domain.InvoiceType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record InvoiceResponse(
        UUID id,
        String number,
        LocalDate invoiceDate,
        LocalDate dueDate,
        UUID projectId,
        String projectName,
        UUID contractId,
        UUID partnerId,
        String partnerName,
        String disciplineMark,
        InvoiceType invoiceType,
        String invoiceTypeDisplayName,
        InvoiceStatus status,
        String statusDisplayName,
        InvoiceMatchingStatus matchingStatus,
        String matchingStatusDisplayName,
        BigDecimal matchingConfidence,
        BigDecimal subtotal,
        BigDecimal vatRate,
        BigDecimal vatAmount,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal remainingAmount,
        BigDecimal paymentPercent,
        boolean overdue,
        UUID ks2Id,
        UUID ks3Id,
        UUID matchedPoId,
        UUID matchedReceiptId,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static InvoiceResponse fromEntity(Invoice invoice) {
        return fromEntity(invoice, null);
    }

    public static InvoiceResponse fromEntity(Invoice invoice, String projectName) {
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getNumber(),
                invoice.getInvoiceDate(),
                invoice.getDueDate(),
                invoice.getProjectId(),
                projectName,
                invoice.getContractId(),
                invoice.getPartnerId(),
                invoice.getPartnerName(),
                invoice.getDisciplineMark(),
                invoice.getInvoiceType(),
                invoice.getInvoiceType().getDisplayName(),
                invoice.getStatus(),
                invoice.getStatus().getDisplayName(),
                invoice.getMatchingStatus(),
                invoice.getMatchingStatus() != null ? invoice.getMatchingStatus().getDisplayName() : null,
                invoice.getMatchingConfidence(),
                invoice.getSubtotal(),
                invoice.getVatRate(),
                invoice.getVatAmount(),
                invoice.getTotalAmount(),
                invoice.getPaidAmount(),
                invoice.getRemainingAmount(),
                invoice.getPaymentPercent(),
                invoice.isOverdue(),
                invoice.getKs2Id(),
                invoice.getKs3Id(),
                invoice.getMatchedPoId(),
                invoice.getMatchedReceiptId(),
                invoice.getNotes(),
                invoice.getCreatedAt(),
                invoice.getUpdatedAt(),
                invoice.getCreatedBy()
        );
    }
}
