package com.privod.platform.modules.support.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateKnowledgeBaseRequest(
        @NotBlank(message = "Заголовок статьи обязателен")
        String title,

        @NotBlank(message = "Содержание статьи обязательно")
        String content,

        UUID categoryId,
        String tags,
        UUID authorId
) {
}
