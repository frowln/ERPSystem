package com.privod.platform.modules.support.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateTicketCommentRequest(
        UUID authorId,

        @NotBlank(message = "Текст комментария обязателен")
        String content,

        boolean isInternal,
        String attachmentUrls
) {
}
