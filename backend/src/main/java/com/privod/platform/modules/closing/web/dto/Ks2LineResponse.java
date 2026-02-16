package com.privod.platform.modules.closing.web.dto;

import com.privod.platform.modules.closing.domain.Ks2Line;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record Ks2LineResponse(
        UUID id,
        UUID ks2Id,
        Integer sequence,
        UUID specItemId,
        String name,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal amount,
        String unitOfMeasure,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static Ks2LineResponse fromEntity(Ks2Line line) {
        return new Ks2LineResponse(
                line.getId(),
                line.getKs2Id(),
                line.getSequence(),
                line.getSpecItemId(),
                line.getName(),
                line.getQuantity(),
                line.getUnitPrice(),
                line.getAmount(),
                line.getUnitOfMeasure(),
                line.getNotes(),
                line.getCreatedAt(),
                line.getUpdatedAt()
        );
    }
}
