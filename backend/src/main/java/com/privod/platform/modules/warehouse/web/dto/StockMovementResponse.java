package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.StockMovement;
import com.privod.platform.modules.warehouse.domain.StockMovementStatus;
import com.privod.platform.modules.warehouse.domain.StockMovementType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record StockMovementResponse(
        UUID id,
        String number,
        LocalDate movementDate,
        StockMovementType movementType,
        String movementTypeDisplayName,
        StockMovementStatus status,
        String statusDisplayName,
        UUID projectId,
        UUID sourceLocationId,
        UUID destinationLocationId,
        UUID purchaseRequestId,
        UUID m29Id,
        UUID responsibleId,
        String responsibleName,
        String notes,
        List<StockMovementLineResponse> lines,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static StockMovementResponse fromEntity(StockMovement movement) {
        return fromEntity(movement, null);
    }

    public static StockMovementResponse fromEntity(StockMovement movement, List<StockMovementLineResponse> lines) {
        return new StockMovementResponse(
                movement.getId(),
                movement.getNumber(),
                movement.getMovementDate(),
                movement.getMovementType(),
                movement.getMovementType() != null ? movement.getMovementType().getDisplayName() : null,
                movement.getStatus(),
                movement.getStatus() != null ? movement.getStatus().getDisplayName() : null,
                movement.getProjectId(),
                movement.getSourceLocationId(),
                movement.getDestinationLocationId(),
                movement.getPurchaseRequestId(),
                movement.getM29Id(),
                movement.getResponsibleId(),
                movement.getResponsibleName(),
                movement.getNotes(),
                lines,
                movement.getCreatedAt(),
                movement.getUpdatedAt(),
                movement.getCreatedBy()
        );
    }
}
