package com.privod.platform.modules.procurementExt.web.dto;

import com.privod.platform.modules.ops.domain.DispatchOrder;
import com.privod.platform.modules.ops.domain.DispatchStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
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
        List<DispatchItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
    public static DispatchOrderResponse fromEntity(DispatchOrder o, List<DispatchItemResponse> items) {
        return new DispatchOrderResponse(
                o.getId(),
                o.getOrderNumber(),
                o.getProjectId(),
                o.getVehicleId(),
                o.getDriverId(),
                o.getLoadingPoint(),
                o.getUnloadingPoint(),
                o.getMaterialName(),
                o.getQuantity(),
                o.getUnit(),
                o.getScheduledDate(),
                o.getScheduledTime(),
                o.getActualDepartureAt(),
                o.getActualArrivalAt(),
                o.getStatus(),
                o.getStatus().getDisplayName(),
                o.getDistance(),
                o.getFuelUsed(),
                o.getNotes(),
                items,
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }
}
