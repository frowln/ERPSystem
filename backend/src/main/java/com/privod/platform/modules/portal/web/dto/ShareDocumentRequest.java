package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record ShareDocumentRequest(
        @NotNull(message = "ID пользователя портала обязателен")
        UUID portalUserId,

        @NotNull(message = "ID документа обязателен")
        UUID documentId,

        UUID projectId,
        UUID sharedById,
        Instant expiresAt
) {
}
