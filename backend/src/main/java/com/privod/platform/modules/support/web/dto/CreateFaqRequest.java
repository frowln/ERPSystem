package com.privod.platform.modules.support.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateFaqRequest(
        @NotBlank(message = "Вопрос обязателен")
        String question,

        @NotBlank(message = "Ответ обязателен")
        String answer,

        UUID categoryId,
        Integer sortOrder
) {
}
