package com.privod.platform.modules.report.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record GenerateReportRequest(
        @NotBlank(message = "Код шаблона обязателен")
        String templateCode,

        String entityType,
        UUID entityId,
        Map<String, Object> parameters,

        @NotNull(message = "Идентификатор генерирующего пользователя обязателен")
        UUID generatedById
) {
}
