package com.privod.platform.modules.pmWorkflow.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateIssueCommentRequest(
        @NotNull(message = "Идентификатор проблемы обязателен")
        UUID issueId,

        @NotNull(message = "Идентификатор автора обязателен")
        UUID authorId,

        @NotBlank(message = "Текст комментария обязателен")
        String commentText,

        String attachmentIds
) {
}
