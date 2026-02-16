package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.StockMovementType;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateStockMovementRequest(
        LocalDate movementDate,

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
