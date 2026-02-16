package com.privod.platform.modules.integration.pricing.web.dto;

import com.privod.platform.modules.integration.pricing.domain.PricingDatabase;
import com.privod.platform.modules.integration.pricing.domain.PricingDatabaseType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PricingDatabaseResponse(
        UUID id,
        String name,
        PricingDatabaseType type,
        String typeDisplayName,
        String region,
        Integer baseYear,
        BigDecimal coefficientToCurrentPrices,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String sourceUrl,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PricingDatabaseResponse fromEntity(PricingDatabase entity) {
        return new PricingDatabaseResponse(
                entity.getId(),
                entity.getName(),
                entity.getType(),
                entity.getType().getDisplayName(),
                entity.getRegion(),
                entity.getBaseYear(),
                entity.getCoefficientToCurrentPrices(),
                entity.getEffectiveFrom(),
                entity.getEffectiveTo(),
                entity.getSourceUrl(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
