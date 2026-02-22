package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.ProfitabilitySnapshot;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProfitabilitySnapshotResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        UUID forecastId,
        String snapshotDate,
        BigDecimal eac,
        BigDecimal etc,
        BigDecimal actualCost,
        BigDecimal earnedValue,
        BigDecimal forecastMargin,
        BigDecimal forecastMarginPercent,
        BigDecimal wipAmount,
        BigDecimal profitFadeAmount,
        BigDecimal completionPercent,
        Instant createdAt
) {
    public static ProfitabilitySnapshotResponse fromEntity(ProfitabilitySnapshot entity) {
        return new ProfitabilitySnapshotResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getForecastId(),
                entity.getSnapshotDate() != null ? entity.getSnapshotDate().toString() : null,
                entity.getEac(),
                entity.getEtc(),
                entity.getActualCost(),
                entity.getEarnedValue(),
                entity.getForecastMargin(),
                entity.getForecastMarginPercent(),
                entity.getWipAmount(),
                entity.getProfitFadeAmount(),
                entity.getCompletionPercent(),
                entity.getCreatedAt()
        );
    }
}
