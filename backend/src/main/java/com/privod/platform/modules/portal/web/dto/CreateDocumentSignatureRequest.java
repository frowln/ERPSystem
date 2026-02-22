package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CreateDocumentSignatureRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "ID портального пользователя обязателен")
        UUID portalUserId,

        UUID documentId,

        @NotBlank(message = "Название документа обязательно")
        @Size(max = 500, message = "Название документа не должно превышать 500 символов")
        String documentTitle,

        @Size(max = 2000, message = "URL документа не должен превышать 2000 символов")
        String documentUrl,

        Instant expiresAt
) {
}
