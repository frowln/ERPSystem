package com.privod.platform.modules.bidScoring.web.dto;

import com.privod.platform.modules.bidScoring.domain.BidScore;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BidScoreResponse(
        UUID id,
        UUID bidComparisonId,
        UUID criteriaId,
        UUID vendorId,
        String vendorName,
        BigDecimal score,
        BigDecimal weightedScore,
        String comments,
        UUID scoredById,
        Instant scoredAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static BidScoreResponse fromEntity(BidScore bs) {
        return new BidScoreResponse(
                bs.getId(),
                bs.getBidComparisonId(),
                bs.getCriteriaId(),
                bs.getVendorId(),
                bs.getVendorName(),
                bs.getScore(),
                bs.getWeightedScore(),
                bs.getComments(),
                bs.getScoredById(),
                bs.getScoredAt(),
                bs.getCreatedAt(),
                bs.getUpdatedAt()
        );
    }
}
