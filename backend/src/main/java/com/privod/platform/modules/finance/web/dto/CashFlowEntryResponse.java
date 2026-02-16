package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.CashFlowCategory;
import com.privod.platform.modules.finance.domain.CashFlowEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CashFlowEntryResponse(
        UUID id,
        UUID projectId,
        LocalDate entryDate,
        String direction,
        CashFlowCategory category,
        String categoryDisplayName,
        BigDecimal amount,
        String description,
        UUID paymentId,
        UUID invoiceId,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static CashFlowEntryResponse fromEntity(CashFlowEntry entry) {
        return new CashFlowEntryResponse(
                entry.getId(),
                entry.getProjectId(),
                entry.getEntryDate(),
                entry.getDirection(),
                entry.getCategory(),
                entry.getCategory().getDisplayName(),
                entry.getAmount(),
                entry.getDescription(),
                entry.getPaymentId(),
                entry.getInvoiceId(),
                entry.getNotes(),
                entry.getCreatedAt(),
                entry.getUpdatedAt(),
                entry.getCreatedBy()
        );
    }
}
