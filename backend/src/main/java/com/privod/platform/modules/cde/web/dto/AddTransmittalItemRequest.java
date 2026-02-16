package com.privod.platform.modules.cde.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddTransmittalItemRequest(
        @NotNull(message = "Идентификатор контейнера документа обязателен")
        UUID documentContainerId,

        @NotNull(message = "Идентификатор ревизии обязателен")
        UUID revisionId,

        String notes,

        Boolean responseRequired,

        Integer sortOrder
) {
}
