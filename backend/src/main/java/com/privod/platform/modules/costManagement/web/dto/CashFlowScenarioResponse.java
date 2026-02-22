package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CashFlowScenario;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CashFlowScenarioResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        String baselineDate,
        int horizonMonths,
        BigDecimal growthRatePercent,
        int paymentDelayDays,
        BigDecimal retentionPercent,
        boolean includeVat,
        boolean isActive,
        Instant createdAt
) {
    public static CashFlowScenarioResponse fromEntity(CashFlowScenario entity) {
        return new CashFlowScenarioResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getDescription(),
                entity.getBaselineDate() != null ? entity.getBaselineDate().toString() : null,
                entity.getHorizonMonths(),
                entity.getGrowthRatePercent(),
                entity.getPaymentDelayDays(),
                entity.getRetentionPercent(),
                entity.isIncludeVat(),
                entity.isActive(),
                entity.getCreatedAt()
        );
    }
}
