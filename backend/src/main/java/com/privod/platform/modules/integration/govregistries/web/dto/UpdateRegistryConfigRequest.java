package com.privod.platform.modules.integration.govregistries.web.dto;

import jakarta.validation.constraints.Size;

public record UpdateRegistryConfigRequest(
        @Size(max = 1000, message = "URL API не должен превышать 1000 символов")
        String apiUrl,

        String apiKey,

        Boolean enabled
) {
}
