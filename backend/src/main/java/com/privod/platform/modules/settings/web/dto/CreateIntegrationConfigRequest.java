package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.IntegrationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CreateIntegrationConfigRequest(
        @NotBlank(message = "Код интеграции обязателен")
        @Size(max = 100, message = "Код не должен превышать 100 символов")
        String code,

        @NotBlank(message = "Название интеграции обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @NotNull(message = "Тип интеграции обязателен")
        IntegrationType integrationType,

        @Size(max = 1000, message = "URL не должен превышать 1000 символов")
        String baseUrl,

        String apiKey,

        String apiSecret,

        Map<String, Object> configJson
) {
}
