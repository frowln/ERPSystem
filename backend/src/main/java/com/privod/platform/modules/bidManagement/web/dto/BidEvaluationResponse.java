package com.privod.platform.modules.bidManagement.web.dto;

import com.privod.platform.modules.bidManagement.domain.BidEvaluation;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BidEvaluationResponse(
        UUID id,
        UUID bidPackageId,
        UUID invitationId,
        String criteriaName,
        Integer score,
        Integer maxScore,
        BigDecimal weight,
        String notes,
        String evaluatorName,
        Instant createdAt
) {
    public static BidEvaluationResponse fromEntity(BidEvaluation entity) {
        return new BidEvaluationResponse(
                entity.getId(),
                entity.getBidPackageId(),
                entity.getInvitationId(),
                entity.getCriteriaName(),
                entity.getScore(),
                entity.getMaxScore(),
                entity.getWeight(),
                entity.getNotes(),
                entity.getEvaluatorName(),
                entity.getCreatedAt()
        );
    }
}
