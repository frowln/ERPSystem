package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LeaveCallRequest(
        @NotNull(message = "Пользователь обязателен")
        UUID userId
) {
}
