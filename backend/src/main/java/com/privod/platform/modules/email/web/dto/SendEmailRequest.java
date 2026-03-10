package com.privod.platform.modules.email.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SendEmailRequest(
        @NotEmpty(message = "Укажите хотя бы одного получателя")
        List<String> to,

        List<String> cc,

        @NotBlank(message = "Тема письма обязательна")
        String subject,

        @NotBlank(message = "Тело письма обязательно")
        String bodyHtml
) {
}
