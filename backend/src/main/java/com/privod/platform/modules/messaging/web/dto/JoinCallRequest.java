package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record JoinCallRequest(
        @NotNull(message = "Пользователь обязателен")
        UUID userId,
        String userName,
        Boolean muted,
        Boolean videoEnabled
) {
}
