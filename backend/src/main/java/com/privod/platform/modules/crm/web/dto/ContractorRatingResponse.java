package com.privod.platform.modules.crm.web.dto;

import com.privod.platform.modules.crm.domain.ContractorRating;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ContractorRatingResponse(
        UUID id,
        UUID counterpartyId,
        UUID projectId,
        UUID ratedBy,
        Integer qualityScore,
        Integer timelinessScore,
        Integer safetyScore,
        Integer communicationScore,
        Integer priceScore,
        BigDecimal overallScore,
        String comment,
        boolean blacklisted,
        String blacklistReason,
        Instant createdAt
) {
    public static ContractorRatingResponse fromEntity(ContractorRating r) {
        return new ContractorRatingResponse(
                r.getId(),
                r.getCounterpartyId(),
                r.getProjectId(),
                r.getRatedBy(),
                r.getQualityScore(),
                r.getTimelinessScore(),
                r.getSafetyScore(),
                r.getCommunicationScore(),
                r.getPriceScore(),
                r.getOverallScore(),
                r.getComment(),
                r.isBlacklisted(),
                r.getBlacklistReason(),
                r.getCreatedAt()
        );
    }
}
