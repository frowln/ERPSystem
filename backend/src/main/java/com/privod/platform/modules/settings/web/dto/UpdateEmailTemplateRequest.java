package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.EmailTemplateCategory;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateEmailTemplateRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @Size(max = 500, message = "Тема не должна превышать 500 символов")
        String subject,

        String bodyHtml,

        String bodyText,

        EmailTemplateCategory category,

        List<String> variables,

        Boolean isActive
) {
}
