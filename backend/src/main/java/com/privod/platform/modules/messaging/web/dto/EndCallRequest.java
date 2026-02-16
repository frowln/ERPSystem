package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record EndCallRequest(
        @NotNull(message = "Пользователь завершивший звонок обязателен")
        UUID endedByUserId
) {
}
