package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record RenderTemplateRequest(
        @NotNull(message = "ID шаблона обязателен")
        UUID templateId,

        Map<String, String> placeholders
) {
}
