package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.MappingDirection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateSyncMappingRequest(
        @NotNull(message = "Идентификатор точки интеграции обязателен")
        UUID endpointId,

        @NotBlank(message = "Локальный тип сущности обязателен")
        @Size(max = 100, message = "Локальный тип сущности не должен превышать 100 символов")
        String localEntityType,

        @NotBlank(message = "Локальное имя поля обязательно")
        @Size(max = 100, message = "Локальное имя поля не должно превышать 100 символов")
        String localFieldName,

        @NotBlank(message = "Удалённый тип сущности обязателен")
        @Size(max = 100, message = "Удалённый тип сущности не должен превышать 100 символов")
        String remoteEntityType,

        @NotBlank(message = "Удалённое имя поля обязательно")
        @Size(max = 100, message = "Удалённое имя поля не должно превышать 100 символов")
        String remoteFieldName,

        @Size(max = 500, message = "Выражение трансформации не должно превышать 500 символов")
        String transformExpression,

        MappingDirection direction,

        Boolean isRequired
) {
}
