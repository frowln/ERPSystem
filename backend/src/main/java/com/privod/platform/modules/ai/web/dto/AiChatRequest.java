package com.privod.platform.modules.ai.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AiChatRequest(
        @NotBlank(message = "Сообщение не может быть пустым")
        @Size(max = 10000, message = "Сообщение не может превышать 10000 символов")
        String message,

        UUID conversationId
) {
}
