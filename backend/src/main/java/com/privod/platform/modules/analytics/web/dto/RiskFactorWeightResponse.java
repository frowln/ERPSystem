package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.RiskFactorCategory;
import com.privod.platform.modules.analytics.domain.RiskFactorWeight;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RiskFactorWeightResponse(
        UUID id,
        UUID organizationId,
        String factorName,
        RiskFactorCategory factorCategory,
        String factorCategoryDisplayName,
        BigDecimal weightValue,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static RiskFactorWeightResponse fromEntity(RiskFactorWeight weight) {
        return new RiskFactorWeightResponse(
                weight.getId(),
                weight.getOrganizationId(),
                weight.getFactorName(),
                weight.getFactorCategory(),
                weight.getFactorCategory().getDisplayName(),
                weight.getWeightValue(),
                weight.getDescription(),
                weight.getCreatedAt(),
                weight.getUpdatedAt()
        );
    }
}
