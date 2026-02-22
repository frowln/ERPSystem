package com.privod.platform.modules.fleet.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Machine-hour rate calculation response per МДС 81-3.2001.
 * Rate = depreciationPerHour + fuelPerHour + maintenancePerHour + insurancePerHour + operatorPerHour
 */
public record MachineHourRateResponse(
        UUID vehicleId,
        String vehicleCode,
        String vehicleName,

        // Input parameters used
        BigDecimal purchasePrice,
        BigDecimal usefulLifeYears,
        BigDecimal annualWorkingHours,
        BigDecimal fuelConsumptionRate,
        BigDecimal fuelPricePerLiter,

        // Component costs per hour
        BigDecimal depreciationPerHour,
        BigDecimal fuelPerHour,
        BigDecimal maintenancePerHour,
        BigDecimal insurancePerHour,
        BigDecimal operatorPerHour,

        // Total machine-hour rate
        BigDecimal totalRatePerHour,

        // Annual totals
        BigDecimal annualDepreciation,
        BigDecimal annualFuelCost,
        BigDecimal annualMaintenanceCost,
        BigDecimal annualInsuranceCost,
        BigDecimal annualOperatorCost,
        BigDecimal annualTotalCost
) {
}
