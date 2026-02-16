package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.IntegrationType;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record UpdateIntegrationConfigRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        IntegrationType integrationType,

        @Size(max = 1000, message = "URL не должен превышать 1000 символов")
        String baseUrl,

        String apiKey,

        String apiSecret,

        Boolean isActive,

        Map<String, Object> configJson
) {
}
