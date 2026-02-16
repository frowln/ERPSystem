package com.privod.platform.modules.planfact.web.dto;

import com.privod.platform.modules.planfact.domain.PlanFactCategory;
import com.privod.platform.modules.planfact.domain.PlanFactLine;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PlanFactLineResponse(
        UUID id,
        UUID projectId,
        Integer sequence,
        PlanFactCategory category,
        String categoryDisplayName,
        BigDecimal planAmount,
        BigDecimal factAmount,
        BigDecimal variance,
        BigDecimal variancePercent,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static PlanFactLineResponse fromEntity(PlanFactLine line) {
        return new PlanFactLineResponse(
                line.getId(),
                line.getProjectId(),
                line.getSequence(),
                line.getCategory(),
                line.getCategory().getDisplayName(),
                line.getPlanAmount(),
                line.getFactAmount(),
                line.getVariance(),
                line.getVariancePercent(),
                line.getNotes(),
                line.getCreatedAt(),
                line.getUpdatedAt()
        );
    }
}
