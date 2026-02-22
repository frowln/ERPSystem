package com.privod.platform.modules.isup.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateIsupConfigRequest(
        @NotBlank(message = "URL API ИСУП обязателен")
        @Size(max = 1000, message = "URL не должен превышать 1000 символов")
        String apiUrl,

        @Size(max = 5000, message = "API ключ не должен превышать 5000 символов")
        String apiKey,

        @Size(max = 1000, message = "Путь к сертификату не должен превышать 1000 символов")
        String certificatePath,

        @NotBlank(message = "ИНН организации обязателен")
        @Size(max = 12, message = "ИНН не должен превышать 12 символов")
        String organizationInn,

        @Size(max = 9, message = "КПП не должен превышать 9 символов")
        String organizationKpp
) {
}
