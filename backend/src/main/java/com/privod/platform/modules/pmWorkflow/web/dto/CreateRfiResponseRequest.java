package com.privod.platform.modules.pmWorkflow.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateRfiResponseRequest(
        @NotNull(message = "Идентификатор RFI обязателен")
        UUID rfiId,

        @NotNull(message = "Идентификатор отвечающего обязателен")
        UUID responderId,

        @NotBlank(message = "Текст ответа обязателен")
        String responseText,

        String attachmentIds,

        Boolean isOfficial
) {
}
