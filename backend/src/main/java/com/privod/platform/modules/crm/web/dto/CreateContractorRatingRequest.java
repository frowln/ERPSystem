package com.privod.platform.modules.crm.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.UUID;

public record CreateContractorRatingRequest(
        UUID projectId,

        @Min(value = 1, message = "Оценка качества от 1 до 5")
        @Max(value = 5, message = "Оценка качества от 1 до 5")
        Integer qualityScore,

        @Min(value = 1, message = "Оценка сроков от 1 до 5")
        @Max(value = 5, message = "Оценка сроков от 1 до 5")
        Integer timelinessScore,

        @Min(value = 1, message = "Оценка безопасности от 1 до 5")
        @Max(value = 5, message = "Оценка безопасности от 1 до 5")
        Integer safetyScore,

        @Min(value = 1, message = "Оценка коммуникации от 1 до 5")
        @Max(value = 5, message = "Оценка коммуникации от 1 до 5")
        Integer communicationScore,

        @Min(value = 1, message = "Оценка цены от 1 до 5")
        @Max(value = 5, message = "Оценка цены от 1 до 5")
        Integer priceScore,

        String comment
) {
}
