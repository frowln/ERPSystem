package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiProvider;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAiModelConfigRequest(
        @NotNull(message = "Провайдер обязателен")
        AiProvider provider,

        @Size(max = 1000, message = "URL API не может превышать 1000 символов")
        String apiUrl,

        @Size(max = 2000, message = "API ключ не может превышать 2000 символов")
        String apiKeyEncrypted,

        @NotBlank(message = "Название модели обязательно")
        @Size(max = 200, message = "Название модели не может превышать 200 символов")
        String modelName,

        @Min(value = 1, message = "Максимальное количество токенов должно быть больше 0")
        @Max(value = 128000, message = "Максимальное количество токенов не может превышать 128000")
        Integer maxTokens,

        @Min(value = 0, message = "Температура должна быть >= 0")
        @Max(value = 2, message = "Температура не может превышать 2")
        Double temperature,

        Boolean isDefault,

        Boolean dataProcessingAgreementSigned
) {
}
