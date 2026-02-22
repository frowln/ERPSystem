package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.ConfidenceLevel;
import com.privod.platform.modules.analytics.domain.PredictionModelType;
import com.privod.platform.modules.analytics.domain.ProjectRiskPrediction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProjectRiskPredictionResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        UUID modelId,
        PredictionModelType predictionType,
        String predictionTypeDisplayName,
        BigDecimal probabilityPercent,
        ConfidenceLevel confidenceLevel,
        String confidenceLevelDisplayName,
        String riskFactorsJson,
        Integer predictedDelayDays,
        BigDecimal predictedOverrunAmount,
        boolean alertGenerated,
        Instant predictedAt,
        Instant validUntil,
        Instant createdAt
) {
    public static ProjectRiskPredictionResponse fromEntity(ProjectRiskPrediction prediction) {
        return new ProjectRiskPredictionResponse(
                prediction.getId(),
                prediction.getOrganizationId(),
                prediction.getProjectId(),
                prediction.getModelId(),
                prediction.getPredictionType(),
                prediction.getPredictionType().getDisplayName(),
                prediction.getProbabilityPercent(),
                prediction.getConfidenceLevel(),
                prediction.getConfidenceLevel().getDisplayName(),
                prediction.getRiskFactorsJson(),
                prediction.getPredictedDelayDays(),
                prediction.getPredictedOverrunAmount(),
                prediction.isAlertGenerated(),
                prediction.getPredictedAt(),
                prediction.getValidUntil(),
                prediction.getCreatedAt()
        );
    }
}
