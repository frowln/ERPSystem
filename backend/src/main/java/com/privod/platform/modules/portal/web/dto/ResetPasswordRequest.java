package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Токен обязателен")
        String token,

        @NotBlank(message = "Новый пароль обязателен")
        @Size(min = 8, message = "Пароль должен содержать минимум 8 символов")
        String newPassword
) {
}
