package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.LegalTemplateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateLegalTemplateRequest(
        @NotBlank(message = "Название шаблона обязательно")
        @Size(max = 300)
        String name,

        @NotNull(message = "Тип шаблона обязателен")
        LegalTemplateType templateType,

        @Size(max = 100)
        String category,

        @NotBlank(message = "Содержание шаблона обязательно")
        String content,

        String variables
) {
}
