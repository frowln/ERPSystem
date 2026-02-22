package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

public record SpecItemWithProgressResponse(
        UUID id,
        String name,
        String unitOfMeasure,
        BigDecimal plannedQuantity,
        BigDecimal unitPrice,
        BigDecimal completedQuantity,
        BigDecimal remainingQuantity,
        int completionPercent
) {
    public static SpecItemWithProgressResponse of(
            UUID id, String name, String unitOfMeasure,
            BigDecimal plannedQuantity, BigDecimal plannedAmount,
            BigDecimal completedQuantity) {

        BigDecimal unitPrice = (plannedQuantity != null && plannedQuantity.compareTo(BigDecimal.ZERO) > 0
                && plannedAmount != null)
                ? plannedAmount.divide(plannedQuantity, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal remaining = plannedQuantity != null
                ? plannedQuantity.subtract(completedQuantity != null ? completedQuantity : BigDecimal.ZERO)
                : BigDecimal.ZERO;
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        int percent = 0;
        if (plannedQuantity != null && plannedQuantity.compareTo(BigDecimal.ZERO) > 0
                && completedQuantity != null) {
            percent = completedQuantity.multiply(new BigDecimal("100"))
                    .divide(plannedQuantity, 0, RoundingMode.HALF_UP)
                    .intValue();
            if (percent > 100) percent = 100;
        }

        return new SpecItemWithProgressResponse(
                id, name, unitOfMeasure,
                plannedQuantity != null ? plannedQuantity : BigDecimal.ZERO,
                unitPrice,
                completedQuantity != null ? completedQuantity : BigDecimal.ZERO,
                remaining,
                percent
        );
    }
}
