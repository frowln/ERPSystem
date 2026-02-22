package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StartViewerSessionRequest(
        @NotNull(message = "Идентификатор модели обязателен")
        UUID modelId
) {
}
