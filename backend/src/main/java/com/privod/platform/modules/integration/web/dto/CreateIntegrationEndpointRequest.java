package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.AuthType;
import com.privod.platform.modules.integration.domain.IntegrationProvider;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateIntegrationEndpointRequest(
        @NotBlank(message = "Код обязателен")
        @Size(max = 50, message = "Код не должен превышать 50 символов")
        String code,

        @NotBlank(message = "Название обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @NotNull(message = "Провайдер обязателен")
        IntegrationProvider provider,

        @NotBlank(message = "Базовый URL обязателен")
        @Size(max = 1000, message = "URL не должен превышать 1000 символов")
        String baseUrl,

        @NotNull(message = "Тип аутентификации обязателен")
        AuthType authType,

        String credentials,

        Boolean isActive,

        @Min(value = 1, message = "Лимит запросов должен быть не менее 1")
        @Max(value = 10000, message = "Лимит запросов не должен превышать 10000")
        Integer rateLimitPerMinute,

        @Min(value = 1000, message = "Тайм-аут должен быть не менее 1000 мс")
        @Max(value = 300000, message = "Тайм-аут не должен превышать 300000 мс")
        Integer timeoutMs
) {
}
