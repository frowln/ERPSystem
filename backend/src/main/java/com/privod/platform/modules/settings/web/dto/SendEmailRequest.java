package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record SendEmailRequest(
        @NotBlank(message = "Код шаблона обязателен")
        String code,

        @NotBlank(message = "Email получателя обязателен")
        @Email(message = "Некорректный формат email")
        String recipientEmail,

        @NotNull(message = "Переменные шаблона обязательны")
        Map<String, String> variables
) {
}
