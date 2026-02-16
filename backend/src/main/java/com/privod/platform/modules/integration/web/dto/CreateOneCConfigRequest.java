package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.SyncDirection;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateOneCConfigRequest(
        @NotBlank(message = "Название конфигурации обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @NotBlank(message = "URL базы 1С обязателен")
        @Size(max = 1000, message = "URL не должен превышать 1000 символов")
        String baseUrl,

        @NotBlank(message = "Имя пользователя обязательно")
        @Size(max = 255, message = "Имя пользователя не должно превышать 255 символов")
        String username,

        @NotBlank(message = "Пароль обязателен")
        String password,

        @NotBlank(message = "Имя базы данных обязательно")
        @Size(max = 255, message = "Имя базы данных не должно превышать 255 символов")
        String databaseName,

        @NotNull(message = "Направление синхронизации обязательно")
        SyncDirection syncDirection,

        @Min(value = 1, message = "Интервал синхронизации должен быть не менее 1 минуты")
        int syncIntervalMinutes
) {
}
