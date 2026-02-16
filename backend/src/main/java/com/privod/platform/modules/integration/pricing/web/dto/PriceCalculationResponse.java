package com.privod.platform.modules.integration.pricing.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PriceCalculationResponse(
        UUID rateId,
        String rateCode,
        String rateName,
        String unit,
        BigDecimal quantity,
        BigDecimal basePricePerUnit,
        BigDecimal baseTotal,
        String region,
        BigDecimal indexValue,
        String indexQuarter,
        BigDecimal currentPricePerUnit,
        BigDecimal currentTotal,
        BigDecimal laborCost,
        BigDecimal materialCost,
        BigDecimal equipmentCost,
        BigDecimal overheadCost
) {
}
