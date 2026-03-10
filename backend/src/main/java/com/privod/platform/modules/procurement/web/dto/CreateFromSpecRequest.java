package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateFromSpecRequest(
        @NotEmpty(message = "Список идентификаторов позиций спецификации обязателен")
        List<UUID> specItemIds,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Идентификатор спецификации обязателен")
        UUID specId
) {
}
