package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EditMessageRequest(
        @NotBlank(message = "Текст сообщения обязателен")
        @Size(max = 10000, message = "Текст сообщения не должен превышать 10000 символов")
        String content
) {
}
