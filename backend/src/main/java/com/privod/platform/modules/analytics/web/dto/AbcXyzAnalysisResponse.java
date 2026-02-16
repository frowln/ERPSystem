package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.AbcCategory;
import com.privod.platform.modules.analytics.domain.AbcXyzAnalysis;
import com.privod.platform.modules.analytics.domain.XyzCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AbcXyzAnalysisResponse(
        UUID id,
        UUID projectId,
        LocalDate analysisDate,
        String entityType,
        UUID entityId,
        String entityName,
        AbcCategory abcCategory,
        String abcCategoryDisplayName,
        XyzCategory xyzCategory,
        String xyzCategoryDisplayName,
        BigDecimal totalValue,
        BigDecimal percentOfTotal,
        BigDecimal variationCoefficient,
        int frequency,
        Instant createdAt,
        Instant updatedAt
) {
    public static AbcXyzAnalysisResponse fromEntity(AbcXyzAnalysis analysis) {
        return new AbcXyzAnalysisResponse(
                analysis.getId(),
                analysis.getProjectId(),
                analysis.getAnalysisDate(),
                analysis.getEntityType(),
                analysis.getEntityId(),
                analysis.getEntityName(),
                analysis.getAbcCategory(),
                analysis.getAbcCategory().getDisplayName(),
                analysis.getXyzCategory(),
                analysis.getXyzCategory().getDisplayName(),
                analysis.getTotalValue(),
                analysis.getPercentOfTotal(),
                analysis.getVariationCoefficient(),
                analysis.getFrequency(),
                analysis.getCreatedAt(),
                analysis.getUpdatedAt()
        );
    }
}
