package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ToleranceCategory;
import com.privod.platform.modules.quality.domain.ToleranceRule;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ToleranceRuleResponse(
        UUID id,
        String name,
        String code,
        ToleranceCategory category,
        String categoryDisplayName,
        String parameterName,
        BigDecimal nominalValue,
        BigDecimal minValue,
        BigDecimal maxValue,
        String unit,
        String standardReference,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ToleranceRuleResponse fromEntity(ToleranceRule entity) {
        return new ToleranceRuleResponse(
                entity.getId(),
                entity.getName(),
                entity.getCode(),
                entity.getCategory(),
                entity.getCategory().getDisplayName(),
                entity.getParameterName(),
                entity.getNominalValue(),
                entity.getMinValue(),
                entity.getMaxValue(),
                entity.getUnit(),
                entity.getStandardReference(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
