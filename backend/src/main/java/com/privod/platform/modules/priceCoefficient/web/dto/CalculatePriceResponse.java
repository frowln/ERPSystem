package com.privod.platform.modules.priceCoefficient.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record CalculatePriceResponse(
        BigDecimal originalPrice,
        BigDecimal adjustedPrice,
        BigDecimal totalCoefficientValue,
        List<AppliedCoefficient> appliedCoefficients
) {
    public record AppliedCoefficient(
            String name,
            String code,
            String type,
            BigDecimal value
    ) {
    }
}
