package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.RateResourceItem;
import com.privod.platform.modules.estimate.domain.ResourceType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RateResourceItemResponse(
        UUID id,
        UUID rateId,
        ResourceType resourceType,
        String resourceCode,
        String resourceName,
        String unit,
        BigDecimal quantityPerUnit,
        BigDecimal basePrice,
        Instant createdAt,
        Instant updatedAt
) {
    public static RateResourceItemResponse fromEntity(RateResourceItem entity) {
        return new RateResourceItemResponse(
                entity.getId(),
                entity.getRateId(),
                entity.getResourceType(),
                entity.getResourceCode(),
                entity.getResourceName(),
                entity.getUnit(),
                entity.getQuantityPerUnit(),
                entity.getBasePrice(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
