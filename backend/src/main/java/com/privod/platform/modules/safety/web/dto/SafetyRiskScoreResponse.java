package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.SafetyRiskLevel;
import com.privod.platform.modules.safety.domain.SafetyRiskScore;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SafetyRiskScoreResponse(
        UUID id,
        UUID projectId,
        int score,
        SafetyRiskLevel riskLevel,
        String riskLevelDisplayName,
        String riskLevelColor,
        String factorsJson,
        String recommendationsJson,
        int incidentCount30d,
        int violationCount30d,
        BigDecimal trainingCompliancePct,
        BigDecimal certExpiryRatio,
        Instant calculatedAt,
        Instant validUntil,
        boolean valid,
        Instant createdAt
) {
    public static SafetyRiskScoreResponse fromEntity(SafetyRiskScore score) {
        return new SafetyRiskScoreResponse(
                score.getId(),
                score.getProjectId(),
                score.getScore(),
                score.getRiskLevel(),
                score.getRiskLevel().getDisplayName(),
                score.getRiskLevel().getColor(),
                score.getFactorsJson(),
                score.getRecommendationsJson(),
                score.getIncidentCount30d(),
                score.getViolationCount30d(),
                score.getTrainingCompliancePct(),
                score.getCertExpiryRatio(),
                score.getCalculatedAt(),
                score.getValidUntil(),
                score.isValid(),
                score.getCreatedAt()
        );
    }
}
