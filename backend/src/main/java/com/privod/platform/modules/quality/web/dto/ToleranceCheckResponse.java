package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ToleranceCheck;
import com.privod.platform.modules.quality.domain.ToleranceCheckStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record ToleranceCheckResponse(
        UUID id,
        UUID toleranceRuleId,
        UUID projectId,
        String location,
        BigDecimal measuredValue,
        boolean isWithinTolerance,
        BigDecimal deviation,
        UUID checkedById,
        LocalDateTime checkedAt,
        String notes,
        ToleranceCheckStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt
) {
    public static ToleranceCheckResponse fromEntity(ToleranceCheck entity) {
        return new ToleranceCheckResponse(
                entity.getId(),
                entity.getToleranceRuleId(),
                entity.getProjectId(),
                entity.getLocation(),
                entity.getMeasuredValue(),
                entity.isWithinTolerance(),
                entity.getDeviation(),
                entity.getCheckedById(),
                entity.getCheckedAt(),
                entity.getNotes(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
