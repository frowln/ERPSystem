package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.SyncDirection;
import com.privod.platform.modules.integration.domain.SyncType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record StartSyncRequest(
        @NotNull(message = "Идентификатор точки интеграции обязателен")
        UUID endpointId,

        @NotNull(message = "Тип синхронизации обязателен")
        SyncType syncType,

        @NotNull(message = "Направление синхронизации обязательно")
        SyncDirection direction,

        @NotBlank(message = "Тип сущности обязателен")
        @Size(max = 100, message = "Тип сущности не должен превышать 100 символов")
        String entityType
) {
}
