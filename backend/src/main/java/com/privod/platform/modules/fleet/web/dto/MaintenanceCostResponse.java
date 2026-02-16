package com.privod.platform.modules.fleet.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MaintenanceCostResponse(
        UUID vehicleId,
        String vehicleCode,
        BigDecimal totalCost
) {
}
