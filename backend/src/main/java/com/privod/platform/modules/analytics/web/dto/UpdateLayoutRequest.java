package com.privod.platform.modules.analytics.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateLayoutRequest(
        @NotBlank(message = "Конфигурация макета обязательна")
        String layoutConfig
) {
}
