package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UploadPortalDocumentRequest(
        @NotNull(message = "ID пользователя портала обязателен")
        UUID portalUserId,

        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название документа обязательно")
        String title,

        String description
) {
}
