package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateFeatureFlagRequest(
        @NotNull(message = "Поле enabled обязательно")
        Boolean enabled
) {
}
