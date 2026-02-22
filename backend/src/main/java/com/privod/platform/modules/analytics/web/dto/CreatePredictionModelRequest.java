package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.PredictionModelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreatePredictionModelRequest(
        @NotNull PredictionModelType modelType,
        @NotBlank @Size(max = 500) String name,
        String description,
        String trainingDataJson
) {
}
