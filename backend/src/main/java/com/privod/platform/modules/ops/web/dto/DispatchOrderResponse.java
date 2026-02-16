package com.privod.platform.modules.ops.web.dto;

import com.privod.platform.modules.ops.domain.DispatchOrder;
import com.privod.platform.modules.ops.domain.DispatchStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record DispatchOrderResponse(
        UUID id,
        String orderNumber,
        UUID projectId,
        UUID vehicleId,
        UUID driverId,
        String loadingPoint,
        String unloadingPoint,
        String materialName,
        BigDecimal quantity,
        String unit,
        LocalDate scheduledDate,
        String scheduledTime,
        LocalDateTime actualDepartureAt,
        LocalDateTime actualArrivalAt,
        DispatchStatus status,
        String statusDisplayName,
        BigDecimal distance,
        BigDecimal fuelUsed,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DispatchOrderResponse fromEntity(DispatchOrder d) {
        return new DispatchOrderResponse(
                d.getId(),
                d.getOrderNumber(),
                d.getProjectId(),
                d.getVehicleId(),
                d.getDriverId(),
                d.getLoadingPoint(),
                d.getUnloadingPoint(),
                d.getMaterialName(),
                d.getQuantity(),
                d.getUnit(),
                d.getScheduledDate(),
                d.getScheduledTime(),
                d.getActualDepartureAt(),
                d.getActualArrivalAt(),
                d.getStatus(),
                d.getStatus().getDisplayName(),
                d.getDistance(),
                d.getFuelUsed(),
                d.getNotes(),
                d.getCreatedAt(),
                d.getUpdatedAt(),
                d.getCreatedBy()
        );
    }
}
