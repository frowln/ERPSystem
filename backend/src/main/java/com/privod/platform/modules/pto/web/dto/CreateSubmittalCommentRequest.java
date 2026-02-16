package com.privod.platform.modules.pto.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateSubmittalCommentRequest(
        UUID authorId,

        @NotBlank(message = "Содержание комментария обязательно")
        String content,

        String attachmentUrl
) {
}
