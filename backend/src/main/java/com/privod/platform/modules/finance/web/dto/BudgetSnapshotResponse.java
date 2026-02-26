package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.BudgetSnapshot;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BudgetSnapshotResponse(
        UUID id,
        UUID budgetId,
        String snapshotName,
        BudgetSnapshot.SnapshotType snapshotType,
        UUID sourceSnapshotId,
        Instant snapshotDate,
        UUID createdById,
        BigDecimal totalCost,
        BigDecimal totalCustomer,
        BigDecimal totalMargin,
        BigDecimal marginPercent,
        String notes,
        Instant createdAt
) {
    public static BudgetSnapshotResponse fromEntity(BudgetSnapshot s) {
        return new BudgetSnapshotResponse(
                s.getId(),
                s.getBudgetId(),
                s.getSnapshotName(),
                s.getSnapshotType(),
                s.getSourceSnapshotId(),
                s.getSnapshotDate(),
                s.getCreatedById(),
                s.getTotalCost(),
                s.getTotalCustomer(),
                s.getTotalMargin(),
                s.getMarginPercent(),
                s.getNotes(),
                s.getCreatedAt()
        );
    }
}
