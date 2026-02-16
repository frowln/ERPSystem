package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.BudgetCategory;
import com.privod.platform.modules.finance.domain.BudgetItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BudgetItemResponse(
        UUID id,
        UUID budgetId,
        Integer sequence,
        BudgetCategory category,
        String categoryDisplayName,
        String name,
        BigDecimal plannedAmount,
        BigDecimal actualAmount,
        BigDecimal committedAmount,
        BigDecimal remainingAmount,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static BudgetItemResponse fromEntity(BudgetItem item) {
        return new BudgetItemResponse(
                item.getId(),
                item.getBudgetId(),
                item.getSequence(),
                item.getCategory(),
                item.getCategory().getDisplayName(),
                item.getName(),
                item.getPlannedAmount(),
                item.getActualAmount(),
                item.getCommittedAmount(),
                item.getRemainingAmount(),
                item.getNotes(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
