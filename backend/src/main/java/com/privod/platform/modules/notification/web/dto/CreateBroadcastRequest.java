package com.privod.platform.modules.notification.web.dto;

import com.privod.platform.modules.notification.domain.BroadcastPriority;
import com.privod.platform.modules.notification.domain.BroadcastType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateBroadcastRequest(
        @NotBlank(message = "Заголовок объявления обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        @NotBlank(message = "Сообщение объявления обязательно")
        String message,

        @NotNull(message = "Тип объявления обязателен")
        BroadcastType type,

        BroadcastPriority priority,

        Instant expiresAt
) {
}
