package com.privod.platform.modules.document.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AddDocumentCommentRequest(
        @NotBlank(message = "Текст комментария обязателен")
        String content,

        String authorName
) {
}
