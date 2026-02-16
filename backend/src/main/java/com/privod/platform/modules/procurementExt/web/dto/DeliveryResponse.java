package com.privod.platform.modules.procurementExt.web.dto;

import com.privod.platform.modules.procurementExt.domain.Delivery;
import com.privod.platform.modules.procurementExt.domain.DeliveryStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DeliveryResponse(
        UUID id,
        UUID routeId,
        UUID purchaseOrderId,
        UUID vehicleId,
        UUID driverId,
        Instant plannedDepartureAt,
        Instant plannedArrivalAt,
        Instant actualDepartureAt,
        Instant actualArrivalAt,
        DeliveryStatus status,
        String statusDisplayName,
        String trackingNumber,
        List<DeliveryItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
    public static DeliveryResponse fromEntity(Delivery d, List<DeliveryItemResponse> items) {
        return new DeliveryResponse(
                d.getId(),
                d.getRouteId(),
                d.getPurchaseOrderId(),
                d.getVehicleId(),
                d.getDriverId(),
                d.getPlannedDepartureAt(),
                d.getPlannedArrivalAt(),
                d.getActualDepartureAt(),
                d.getActualArrivalAt(),
                d.getStatus(),
                d.getStatus().getDisplayName(),
                d.getTrackingNumber(),
                items,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
