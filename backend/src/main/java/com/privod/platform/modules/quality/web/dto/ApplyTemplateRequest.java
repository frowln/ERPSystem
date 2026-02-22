package com.privod.platform.modules.quality.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ApplyTemplateRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Идентификатор шаблона обязателен")
        UUID templateId
) {
}
