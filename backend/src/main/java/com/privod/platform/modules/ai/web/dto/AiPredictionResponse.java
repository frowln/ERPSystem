package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiPrediction;
import com.privod.platform.modules.ai.domain.PredictionType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AiPredictionResponse(
        UUID id,
        UUID projectId,
        PredictionType predictionType,
        String predictionTypeDisplayName,
        Map<String, Object> inputData,
        Map<String, Object> result,
        Double confidence,
        Double actualValue,
        Double accuracy,
        Instant createdAt
) {
    public static AiPredictionResponse fromEntity(AiPrediction entity) {
        return new AiPredictionResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getPredictionType(),
                entity.getPredictionType().getDisplayName(),
                entity.getInputData(),
                entity.getResult(),
                entity.getConfidence(),
                entity.getActualValue(),
                entity.getAccuracy(),
                entity.getCreatedAt()
        );
    }
}
