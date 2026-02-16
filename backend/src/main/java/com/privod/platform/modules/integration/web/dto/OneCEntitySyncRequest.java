package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.SyncType;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record OneCEntitySyncRequest(
        @NotNull(message = "Идентификатор точки интеграции обязателен")
        UUID endpointId,

        SyncType syncType,

        Instant since
) {
}
