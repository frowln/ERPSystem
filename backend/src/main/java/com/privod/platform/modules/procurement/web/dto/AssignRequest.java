package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignRequest(
        @NotNull(message = "Идентификатор менеджера по закупкам обязателен")
        UUID assignedToId
) {
}
