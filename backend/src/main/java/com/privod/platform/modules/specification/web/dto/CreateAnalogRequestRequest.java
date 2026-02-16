package com.privod.platform.modules.specification.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateAnalogRequestRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Идентификатор оригинального материала обязателен")
        UUID originalMaterialId,

        @NotNull(message = "Идентификатор инициатора обязателен")
        UUID requestedById,

        String reason
) {
}
