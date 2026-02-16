package com.privod.platform.modules.fleet.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FuelConsumptionReportResponse(
        UUID vehicleId,
        String vehicleCode,
        LocalDate periodFrom,
        LocalDate periodTo,
        BigDecimal totalQuantity,
        BigDecimal totalCost,
        BigDecimal averagePricePerUnit
) {
}
