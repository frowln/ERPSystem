package com.privod.platform.modules.fleet.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Own-vs-rent comparison for equipment.
 */
public record OwnVsRentResponse(
        UUID vehicleId,
        String vehicleCode,
        String vehicleName,

        // Own costs
        BigDecimal ownRatePerHour,
        BigDecimal ownMonthlyCost,
        BigDecimal ownAnnualCost,

        // Rent costs
        BigDecimal marketRentalRatePerHour,
        BigDecimal rentMonthlyCost,
        BigDecimal rentAnnualCost,

        // Comparison
        BigDecimal savingsPerHour,
        BigDecimal savingsAnnual,
        BigDecimal savingsPercent,
        String recommendation
) {
}
