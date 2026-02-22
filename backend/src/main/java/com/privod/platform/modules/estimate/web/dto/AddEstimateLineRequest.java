package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record AddEstimateLineRequest(
        UUID rateId,
        String justification,
        @NotBlank String name,
        String unit,
        @NotNull BigDecimal quantity,
        String notes,
        String normativeCode,
        BigDecimal normHours,
        BigDecimal basePrice2001,
        BigDecimal priceIndex,
        BigDecimal currentPrice,
        BigDecimal directCosts,
        BigDecimal overheadCosts,
        BigDecimal estimatedProfit,
        UUID budgetItemId
) {
}
