package com.privod.platform.modules.integration.web.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateWebhookEndpointRequest(
        @Size(max = 1000, message = "URL не должен превышать 1000 символов")
        String url,

        String secret,

        List<String> events,

        Boolean isActive
) {
}
