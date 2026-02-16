package com.privod.platform.modules.m29.web.dto;

import com.privod.platform.modules.m29.domain.M29Line;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record M29LineResponse(
        UUID id,
        UUID m29Id,
        UUID specItemId,
        Integer sequence,
        String name,
        BigDecimal plannedQuantity,
        BigDecimal actualQuantity,
        String unitOfMeasure,
        BigDecimal variance,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static M29LineResponse fromEntity(M29Line line) {
        return new M29LineResponse(
                line.getId(),
                line.getM29Id(),
                line.getSpecItemId(),
                line.getSequence(),
                line.getName(),
                line.getPlannedQuantity(),
                line.getActualQuantity(),
                line.getUnitOfMeasure(),
                line.getVariance(),
                line.getNotes(),
                line.getCreatedAt(),
                line.getUpdatedAt()
        );
    }
}
