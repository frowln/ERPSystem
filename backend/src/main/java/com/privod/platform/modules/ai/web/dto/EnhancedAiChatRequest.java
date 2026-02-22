package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiContextType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record EnhancedAiChatRequest(
        @NotBlank(message = "Сообщение не может быть пустым")
        @Size(max = 10000, message = "Сообщение не может превышать 10000 символов")
        String message,

        UUID conversationId,

        AiContextType contextType,

        UUID entityId
) {
}
