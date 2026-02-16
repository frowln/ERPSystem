package com.privod.platform.modules.integration.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSbisConfigRequest(
        @NotBlank(message = "Название конфигурации обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @NotBlank(message = "URL API СБИС обязателен")
        @Size(max = 1000, message = "URL не должен превышать 1000 символов")
        String apiUrl,

        @NotBlank(message = "Логин обязателен")
        @Size(max = 255, message = "Логин не должен превышать 255 символов")
        String login,

        @NotBlank(message = "Пароль обязателен")
        String password,

        @Size(max = 255, message = "Отпечаток сертификата не должен превышать 255 символов")
        String certificateThumbprint,

        @NotBlank(message = "ИНН организации обязателен")
        @Size(max = 12, message = "ИНН не должен превышать 12 символов")
        String organizationInn,

        @Size(max = 9, message = "КПП не должен превышать 9 символов")
        String organizationKpp,

        boolean autoSend
) {
}
