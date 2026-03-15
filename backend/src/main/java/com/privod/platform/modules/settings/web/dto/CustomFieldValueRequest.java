package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CustomFieldValueRequest(
        @NotNull(message = "ID определения поля обязателен")
        UUID definitionId,

        Object value
) {
}
