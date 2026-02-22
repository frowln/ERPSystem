package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.CompetitiveListEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CompetitiveListEntryResponse(
        UUID id,
        UUID competitiveListId,
        UUID specItemId,
        UUID invoiceId,
        UUID invoiceLineId,
        UUID vendorId,
        String vendorName,
        BigDecimal unitPrice,
        BigDecimal quantity,
        BigDecimal totalPrice,
        Integer deliveryDays,
        String paymentTerms,
        BigDecimal prepaymentPercent,
        Integer paymentDelayDays,
        Integer warrantyMonths,
        BigDecimal score,
        Integer rankPosition,
        boolean isWinner,
        String selectionReason,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static CompetitiveListEntryResponse fromEntity(CompetitiveListEntry entity) {
        return new CompetitiveListEntryResponse(
                entity.getId(),
                entity.getCompetitiveListId(),
                entity.getSpecItemId(),
                entity.getInvoiceId(),
                entity.getInvoiceLineId(),
                entity.getVendorId(),
                entity.getVendorName(),
                entity.getUnitPrice(),
                entity.getQuantity(),
                entity.getTotalPrice(),
                entity.getDeliveryDays(),
                entity.getPaymentTerms(),
                entity.getPrepaymentPercent(),
                entity.getPaymentDelayDays(),
                entity.getWarrantyMonths(),
                entity.getScore(),
                entity.getRankPosition(),
                entity.isWinner(),
                entity.getSelectionReason(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
