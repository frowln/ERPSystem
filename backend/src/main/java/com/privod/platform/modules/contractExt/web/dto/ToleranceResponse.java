package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.Tolerance;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ToleranceResponse(
        UUID id,
        UUID projectId,
        String workType,
        String parameter,
        BigDecimal nominalValue,
        String unit,
        BigDecimal minDeviation,
        BigDecimal maxDeviation,
        String measurementMethod,
        String referenceStandard,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ToleranceResponse fromEntity(Tolerance entity) {
        return new ToleranceResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getWorkType(),
                entity.getParameter(),
                entity.getNominalValue(),
                entity.getUnit(),
                entity.getMinDeviation(),
                entity.getMaxDeviation(),
                entity.getMeasurementMethod(),
                entity.getReferenceStandard(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
