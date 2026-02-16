package com.privod.platform.modules.integration.pricing.web.dto;

import com.privod.platform.modules.integration.pricing.domain.PriceIndex;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PriceIndexResponse(
        UUID id,
        String region,
        String workType,
        String baseQuarter,
        String targetQuarter,
        BigDecimal indexValue,
        String source,
        Instant createdAt,
        Instant updatedAt
) {
    public static PriceIndexResponse fromEntity(PriceIndex entity) {
        return new PriceIndexResponse(
                entity.getId(),
                entity.getRegion(),
                entity.getWorkType(),
                entity.getBaseQuarter(),
                entity.getTargetQuarter(),
                entity.getIndexValue(),
                entity.getSource(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
