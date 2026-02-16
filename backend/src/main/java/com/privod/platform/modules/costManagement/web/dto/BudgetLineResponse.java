package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.BudgetLine;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BudgetLineResponse(
        UUID id,
        UUID projectId,
        UUID costCodeId,
        String description,
        BigDecimal originalBudget,
        BigDecimal approvedChanges,
        BigDecimal revisedBudget,
        BigDecimal committedCost,
        BigDecimal actualCost,
        BigDecimal forecastFinalCost,
        BigDecimal varianceAmount,
        BigDecimal uncommittedBudget,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static BudgetLineResponse fromEntity(BudgetLine entity) {
        return new BudgetLineResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getCostCodeId(),
                entity.getDescription(),
                entity.getOriginalBudget(),
                entity.getApprovedChanges(),
                entity.getRevisedBudget(),
                entity.getCommittedCost(),
                entity.getActualCost(),
                entity.getForecastFinalCost(),
                entity.getVarianceAmount(),
                entity.getUncommittedBudget(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
