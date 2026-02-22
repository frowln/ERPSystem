package com.privod.platform.modules.apiManagement.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfigureConnectorRequest(
        @NotBlank(message = "Конфигурация обязательна")
        String configJson
) {
}
