package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.EmailTemplateCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateEmailTemplateRequest(
        @NotBlank(message = "Код шаблона обязателен")
        @Size(max = 100, message = "Код не должен превышать 100 символов")
        String code,

        @NotBlank(message = "Название шаблона обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @NotBlank(message = "Тема письма обязательна")
        @Size(max = 500, message = "Тема не должна превышать 500 символов")
        String subject,

        String bodyHtml,

        String bodyText,

        @NotNull(message = "Категория обязательна")
        EmailTemplateCategory category,

        List<String> variables
) {
}
