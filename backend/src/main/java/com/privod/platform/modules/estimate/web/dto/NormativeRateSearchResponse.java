package com.privod.platform.modules.estimate.web.dto;

public record NormativeRateSearchResponse(
        String code,
        String name,
        String source,
        String unit,
        double basePrice2001,
        double laborCost,
        double materialCost,
        double equipmentCost
) {}
