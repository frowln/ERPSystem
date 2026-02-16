package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.StockMovementType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateStockMovementRequest(
        @NotNull(message = "Дата движения обязательна")
        LocalDate movementDate,

        @NotNull(message = "Тип движения обязателен")
        StockMovementType movementType,

        UUID projectId,

        UUID sourceLocationId,

        UUID destinationLocationId,

        UUID purchaseRequestId,

        UUID m29Id,

        UUID responsibleId,

        String responsibleName,

        String notes
) {
}
