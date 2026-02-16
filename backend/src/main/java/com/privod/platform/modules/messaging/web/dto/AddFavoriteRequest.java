package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AddFavoriteRequest(
        @NotNull(message = "Идентификатор сообщения обязателен")
        UUID messageId,

        @Size(max = 1000, message = "Заметка не должна превышать 1000 символов")
        String note
) {
}
