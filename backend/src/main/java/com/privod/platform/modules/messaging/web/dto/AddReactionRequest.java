package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddReactionRequest(
        @NotBlank(message = "Эмодзи обязателен")
        @Size(max = 50, message = "Эмодзи не должен превышать 50 символов")
        String emoji
) {
}
