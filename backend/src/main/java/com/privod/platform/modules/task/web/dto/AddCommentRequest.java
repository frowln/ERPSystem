package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AddCommentRequest(
        @NotBlank(message = "Текст комментария обязателен")
        String content,

        String authorName
) {
}
