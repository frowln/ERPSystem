package com.privod.platform.modules.taxRisk.web.dto;

import com.privod.platform.modules.taxRisk.domain.FactorCategory;
import com.privod.platform.modules.taxRisk.domain.TaxRiskFactor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TaxRiskFactorResponse(
        UUID id,
        UUID assessmentId,
        String factorName,
        FactorCategory factorCategory,
        String factorCategoryDisplayName,
        BigDecimal weight,
        BigDecimal score,
        BigDecimal weightedScore,
        String description,
        String recommendation,
        String evidence,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static TaxRiskFactorResponse fromEntity(TaxRiskFactor f) {
        return new TaxRiskFactorResponse(
                f.getId(),
                f.getAssessmentId(),
                f.getFactorName(),
                f.getFactorCategory(),
                f.getFactorCategory().getDisplayName(),
                f.getWeight(),
                f.getScore(),
                f.getWeightedScore(),
                f.getDescription(),
                f.getRecommendation(),
                f.getEvidence(),
                f.getCreatedAt(),
                f.getUpdatedAt(),
                f.getCreatedBy()
        );
    }
}
