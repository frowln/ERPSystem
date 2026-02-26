package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.InvoiceLine;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InvoiceLineResponse(
        UUID id,
        UUID invoiceId,
        Integer sequence,
        String name,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal amount,
        String unitOfMeasure,
        UUID budgetItemId,
        UUID cpItemId,
        Boolean selectedForCp,
        Instant createdAt,
        Instant updatedAt
) {
    public static InvoiceLineResponse fromEntity(InvoiceLine line) {
        return new InvoiceLineResponse(
                line.getId(),
                line.getInvoiceId(),
                line.getSequence(),
                line.getName(),
                line.getQuantity(),
                line.getUnitPrice(),
                line.getAmount(),
                line.getUnitOfMeasure(),
                line.getBudgetItemId(),
                line.getCpItemId(),
                line.isSelectedForCp(),
                line.getCreatedAt(),
                line.getUpdatedAt()
        );
    }
}
