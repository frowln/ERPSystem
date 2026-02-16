package com.privod.platform.modules.integration.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateWebhookEndpointRequest(
        @NotBlank(message = "Код обязателен")
        @Size(max = 50, message = "Код не должен превышать 50 символов")
        String code,

        @NotBlank(message = "URL обязателен")
        @Size(max = 1000, message = "URL не должен превышать 1000 символов")
        String url,

        String secret,

        List<String> events,

        Boolean isActive
) {
}
