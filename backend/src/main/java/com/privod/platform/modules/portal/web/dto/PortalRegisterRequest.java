package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PortalRegisterRequest(
        @NotBlank(message = "Email обязателен")
        @Email(message = "Некорректный формат email")
        String email,

        @NotBlank(message = "Пароль обязателен")
        @Size(min = 8, message = "Пароль должен содержать минимум 8 символов")
        String password,

        @NotBlank(message = "Имя обязательно")
        @Size(max = 100, message = "Имя не должно превышать 100 символов")
        String firstName,

        @NotBlank(message = "Фамилия обязательна")
        @Size(max = 100, message = "Фамилия не должна превышать 100 символов")
        String lastName,

        @Size(max = 50)
        String phone,

        @Size(max = 500)
        String organizationName,

        @Size(max = 12, message = "ИНН не должен превышать 12 символов")
        String inn,

        @NotNull(message = "Роль обязательна")
        PortalRole portalRole
) {
}
