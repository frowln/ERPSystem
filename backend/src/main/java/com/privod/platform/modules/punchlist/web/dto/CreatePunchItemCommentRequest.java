package com.privod.platform.modules.punchlist.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreatePunchItemCommentRequest(
        UUID authorId,

        @NotBlank(message = "Текст комментария обязателен")
        String content,

        String attachmentUrl
) {
}
