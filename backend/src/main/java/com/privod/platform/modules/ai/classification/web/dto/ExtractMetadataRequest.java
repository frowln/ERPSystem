package com.privod.platform.modules.ai.classification.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ExtractMetadataRequest(
        @NotNull(message = "ID документа обязателен")
        UUID documentId
) {
}
