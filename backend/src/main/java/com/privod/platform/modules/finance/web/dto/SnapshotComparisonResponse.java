package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.BudgetSnapshot;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SnapshotComparisonResponse(
        UUID snapshotId,
        String snapshotName,
        Instant snapshotDate,
        BigDecimal snapshotTotalCost,
        BigDecimal snapshotTotalCustomer,
        BigDecimal snapshotTotalMargin,
        BigDecimal currentTotalCost,
        BigDecimal currentTotalCustomer,
        BigDecimal currentTotalMargin,
        BigDecimal deltaCost,
        BigDecimal deltaCustomer,
        BigDecimal deltaMargin,
        List<ItemDelta> items,
        UUID targetSnapshotId,
        String targetSnapshotName,
        BudgetSnapshot.SnapshotType targetSnapshotType,
        Instant targetSnapshotDate,
        boolean comparedWithCurrent
) {
    public record ItemDelta(
            UUID itemId,
            String name,
            BigDecimal snapshotCostPrice,
            BigDecimal currentCostPrice,
            BigDecimal deltaCostPrice,
            BigDecimal snapshotCustomerPrice,
            BigDecimal currentCustomerPrice,
            BigDecimal deltaCustomerPrice,
            BigDecimal snapshotQuantity,
            BigDecimal currentQuantity,
            BigDecimal deltaQuantity,
            BigDecimal snapshotMarginAmount,
            BigDecimal currentMarginAmount,
            BigDecimal deltaMarginAmount,
            String changeType
    ) {
    }
}
