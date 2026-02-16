package com.privod.platform.modules.ai.web.dto;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(
        @NotBlank(message = "Message content is required")
        String content
) {
}
