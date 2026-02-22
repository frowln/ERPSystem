package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.PredictionModel;
import com.privod.platform.modules.analytics.domain.PredictionModelType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PredictionModelResponse(
        UUID id,
        UUID organizationId,
        PredictionModelType modelType,
        String modelTypeDisplayName,
        String name,
        String description,
        String trainingDataJson,
        BigDecimal accuracyPercent,
        boolean isActive,
        Instant trainedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static PredictionModelResponse fromEntity(PredictionModel model) {
        return new PredictionModelResponse(
                model.getId(),
                model.getOrganizationId(),
                model.getModelType(),
                model.getModelType().getDisplayName(),
                model.getName(),
                model.getDescription(),
                model.getTrainingDataJson(),
                model.getAccuracyPercent(),
                model.isActive(),
                model.getTrainedAt(),
                model.getCreatedAt(),
                model.getUpdatedAt()
        );
    }
}
