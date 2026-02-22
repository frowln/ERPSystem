package com.privod.platform.modules.ai.classification.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CrossCheckRequest(
        @NotNull(message = "ID исходного документа обязателен")
        UUID sourceDocumentId,

        @NotNull(message = "ID целевого документа обязателен")
        UUID targetDocumentId
) {
}
