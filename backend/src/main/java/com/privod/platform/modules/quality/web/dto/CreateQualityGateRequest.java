package com.privod.platform.modules.quality.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateQualityGateRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Идентификатор узла WBS обязателен")
        UUID wbsNodeId,

        @NotBlank(message = "Наименование обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        String requiredDocumentsJson,

        String requiredQualityChecksJson,

        Integer volumeThresholdPercent
) {
}
