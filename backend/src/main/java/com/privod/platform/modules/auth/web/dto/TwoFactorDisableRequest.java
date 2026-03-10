package com.privod.platform.modules.auth.web.dto;

import jakarta.validation.constraints.NotBlank;

public record TwoFactorDisableRequest(
        @NotBlank(message = "Пароль обязателен")
        String password,

        @NotBlank(message = "Код верификации обязателен")
        String code
) {
}
