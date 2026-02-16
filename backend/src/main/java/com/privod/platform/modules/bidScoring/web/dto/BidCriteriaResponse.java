package com.privod.platform.modules.bidScoring.web.dto;

import com.privod.platform.modules.bidScoring.domain.BidCriteria;
import com.privod.platform.modules.bidScoring.domain.CriteriaType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BidCriteriaResponse(
        UUID id,
        UUID bidComparisonId,
        CriteriaType criteriaType,
        String criteriaTypeDisplayName,
        String name,
        String description,
        BigDecimal weight,
        Integer maxScore,
        Integer sortOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static BidCriteriaResponse fromEntity(BidCriteria bc) {
        return new BidCriteriaResponse(
                bc.getId(),
                bc.getBidComparisonId(),
                bc.getCriteriaType(),
                bc.getCriteriaType() != null ? bc.getCriteriaType().getDisplayName() : null,
                bc.getName(),
                bc.getDescription(),
                bc.getWeight(),
                bc.getMaxScore(),
                bc.getSortOrder(),
                bc.getCreatedAt(),
                bc.getUpdatedAt()
        );
    }
}
