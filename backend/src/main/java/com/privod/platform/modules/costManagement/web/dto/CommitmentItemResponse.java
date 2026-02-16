package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CommitmentItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CommitmentItemResponse(
        UUID id,
        UUID commitmentId,
        String description,
        UUID costCodeId,
        BigDecimal quantity,
        String unit,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        BigDecimal invoicedAmount,
        Integer sortOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static CommitmentItemResponse fromEntity(CommitmentItem entity) {
        return new CommitmentItemResponse(
                entity.getId(),
                entity.getCommitmentId(),
                entity.getDescription(),
                entity.getCostCodeId(),
                entity.getQuantity(),
                entity.getUnit(),
                entity.getUnitPrice(),
                entity.getTotalPrice(),
                entity.getInvoicedAmount(),
                entity.getSortOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
