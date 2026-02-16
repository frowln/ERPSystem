package com.privod.platform.modules.specification.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateSpecificationRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        UUID contractId,

        String notes
) {
}
