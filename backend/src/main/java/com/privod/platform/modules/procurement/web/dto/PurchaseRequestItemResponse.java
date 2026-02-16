package com.privod.platform.modules.procurement.web.dto;

import com.privod.platform.modules.procurement.domain.PurchaseRequestItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PurchaseRequestItemResponse(
        UUID id,
        UUID requestId,
        UUID specItemId,
        Integer sequence,
        String name,
        BigDecimal quantity,
        String unitOfMeasure,
        BigDecimal unitPrice,
        BigDecimal amount,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static PurchaseRequestItemResponse fromEntity(PurchaseRequestItem item) {
        return new PurchaseRequestItemResponse(
                item.getId(),
                item.getRequestId(),
                item.getSpecItemId(),
                item.getSequence(),
                item.getName(),
                item.getQuantity(),
                item.getUnitOfMeasure(),
                item.getUnitPrice(),
                item.getAmount(),
                item.getNotes(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
