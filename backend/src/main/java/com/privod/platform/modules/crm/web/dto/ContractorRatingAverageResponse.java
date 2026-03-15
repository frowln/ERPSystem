package com.privod.platform.modules.crm.web.dto;

public record ContractorRatingAverageResponse(
        Double qualityScore,
        Double timelinessScore,
        Double safetyScore,
        Double communicationScore,
        Double priceScore,
        Double overallAverage,
        long totalRatings
) {
}
