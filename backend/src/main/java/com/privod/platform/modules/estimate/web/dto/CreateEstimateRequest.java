package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateEstimateRequest(
        @NotBlank(message = "Наименование сметы обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        UUID contractId,

        @NotNull(message = "Идентификатор спецификации обязателен")
        UUID specificationId,

        String notes
) {
}
