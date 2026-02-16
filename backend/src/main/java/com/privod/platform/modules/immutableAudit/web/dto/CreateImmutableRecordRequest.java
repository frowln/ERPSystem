package com.privod.platform.modules.immutableAudit.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateImmutableRecordRequest(
        @NotBlank(message = "Тип сущности обязателен")
        String entityType,

        @NotNull(message = "ID сущности обязателен")
        UUID entityId,

        @NotBlank(message = "Снимок содержимого обязателен")
        String contentSnapshot,

        UUID recordedById,

        String action
) {
}
