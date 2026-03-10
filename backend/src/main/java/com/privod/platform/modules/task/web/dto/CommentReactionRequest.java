package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CommentReactionRequest(
        @NotNull UUID userId,
        String userName,
        @NotBlank String emoji
) {
}
