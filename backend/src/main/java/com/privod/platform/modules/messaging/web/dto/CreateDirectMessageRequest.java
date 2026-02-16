package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateDirectMessageRequest(
        @NotNull(message = "Идентификатор собеседника обязателен")
        UUID targetUserId,

        String targetUserName
) {
}
