package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiPromptCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CreatePromptTemplateRequest(
        @NotBlank(message = "Название шаблона обязательно")
        @Size(max = 500, message = "Название не может превышать 500 символов")
        String name,

        @NotNull(message = "Категория обязательна")
        AiPromptCategory category,

        @NotBlank(message = "Текст промпта на русском обязателен")
        String promptTextRu,

        String promptTextEn,

        Map<String, Object> variablesJson,

        Boolean isSystem
) {
}
