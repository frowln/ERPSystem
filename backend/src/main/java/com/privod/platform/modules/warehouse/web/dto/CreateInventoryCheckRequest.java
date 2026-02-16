package com.privod.platform.modules.warehouse.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateInventoryCheckRequest(
        @NotNull(message = "Дата инвентаризации обязательна")
        LocalDate checkDate,

        @NotNull(message = "Склад обязателен")
        UUID locationId,

        UUID projectId,

        UUID responsibleId,

        String responsibleName,

        String notes
) {
}
