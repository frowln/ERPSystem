package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMailTemplateRequest(
        @NotBlank(message = "Название шаблона обязательно")
        @Size(max = 255, message = "Название шаблона не должно превышать 255 символов")
        String name,

        String modelName,

        @Size(max = 1000, message = "Тема не должна превышать 1000 символов")
        String subject,

        String bodyHtml,

        @Size(max = 500, message = "Email отправителя не должен превышать 500 символов")
        String emailFrom,

        @Size(max = 500, message = "Email получателя не должен превышать 500 символов")
        String emailTo,

        @Size(max = 500, message = "Email копии не должен превышать 500 символов")
        String emailCc,

        @Size(max = 500, message = "Email для ответа не должен превышать 500 символов")
        String replyTo,

        @Size(max = 10, message = "Код языка не должен превышать 10 символов")
        String lang
) {
}
