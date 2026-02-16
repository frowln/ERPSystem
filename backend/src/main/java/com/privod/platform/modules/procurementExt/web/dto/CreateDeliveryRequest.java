package com.privod.platform.modules.procurementExt.web.dto;

import java.time.Instant;
import java.util.UUID;

public record CreateDeliveryRequest(
        UUID routeId,
        UUID purchaseOrderId,
        UUID vehicleId,
        UUID driverId,
        Instant plannedDepartureAt,
        Instant plannedArrivalAt,
        String trackingNumber
) {
}
