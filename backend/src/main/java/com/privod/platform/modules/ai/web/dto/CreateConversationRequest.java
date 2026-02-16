package com.privod.platform.modules.ai.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateConversationRequest(
        @NotNull(message = "User ID is required")
        UUID userId,

        UUID projectId,

        @NotBlank(message = "Title is required")
        @Size(max = 500, message = "Title must not exceed 500 characters")
        String title
) {
}
