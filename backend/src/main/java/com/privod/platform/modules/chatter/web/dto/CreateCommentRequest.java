package com.privod.platform.modules.chatter.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateCommentRequest(
        @NotBlank(message = "Тип сущности обязателен")
        @Size(max = 100, message = "Тип сущности не должен превышать 100 символов")
        String entityType,

        @NotNull(message = "Идентификатор сущности обязателен")
        UUID entityId,

        @NotNull(message = "Идентификатор автора обязателен")
        UUID authorId,

        @NotBlank(message = "Содержание комментария обязательно")
        String content,

        List<String> attachmentUrls,
        UUID parentCommentId,
        List<UUID> mentionedUserIds,
        boolean isInternal
) {
}
