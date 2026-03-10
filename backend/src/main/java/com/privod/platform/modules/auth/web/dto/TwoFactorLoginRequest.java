package com.privod.platform.modules.auth.web.dto;

import jakarta.validation.constraints.NotBlank;

public record TwoFactorLoginRequest(
        @NotBlank(message = "Временный токен обязателен")
        String tempToken,

        @NotBlank(message = "Код верификации обязателен")
        String code
) {
}
