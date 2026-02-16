package com.privod.platform.modules.integration.telegram.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TestMessageRequest(
        @NotBlank(message = "ID чата обязателен")
        @Size(max = 100, message = "ID чата не должен превышать 100 символов")
        String chatId,

        @NotBlank(message = "Текст сообщения обязателен")
        @Size(max = 4096, message = "Текст сообщения не должен превышать 4096 символов")
        String message
) {
}
