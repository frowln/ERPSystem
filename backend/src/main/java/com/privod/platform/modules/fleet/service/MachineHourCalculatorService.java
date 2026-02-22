package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.MachineHourRateResponse;
import com.privod.platform.modules.fleet.web.dto.OwnVsRentResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Machine-hour rate calculator per МДС 81-3.2001.
 * <p>
 * Rate = depreciation/h + fuel/h + maintenance/h + insurance/h + operator/h
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MachineHourCalculatorService {

    private static final int SCALE = 2;
    private static final RoundingMode RM = RoundingMode.HALF_UP;
    private static final BigDecimal MONTHS_IN_YEAR = new BigDecimal("12");
    private static final BigDecimal DEFAULT_FUEL_PRICE = new BigDecimal("60.00"); // RUB per liter

    private final VehicleRepository vehicleRepository;

    @Transactional(readOnly = true)
    public MachineHourRateResponse calculateRate(UUID vehicleId, BigDecimal fuelPricePerLiter) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Vehicle vehicle = getVehicleOrThrow(vehicleId, organizationId);

        BigDecimal fuelPrice = fuelPricePerLiter != null ? fuelPricePerLiter : DEFAULT_FUEL_PRICE;

        BigDecimal purchasePrice = orZero(vehicle.getPurchasePrice());
        BigDecimal usefulLifeYears = orZero(vehicle.getUsefulLifeYears());
        BigDecimal annualWorkingHours = orDefault(vehicle.getAnnualWorkingHours(), new BigDecimal("1800"));
        BigDecimal fuelConsumptionRate = orZero(vehicle.getFuelConsumptionRate());

        // 1. Depreciation per hour = purchasePrice / (usefulLifeYears * annualWorkingHours)
        BigDecimal annualDepreciation = BigDecimal.ZERO;
        BigDecimal depreciationPerHour = BigDecimal.ZERO;
        if (usefulLifeYears.compareTo(BigDecimal.ZERO) > 0 && annualWorkingHours.compareTo(BigDecimal.ZERO) > 0) {
            annualDepreciation = purchasePrice.divide(usefulLifeYears, SCALE, RM);
            depreciationPerHour = annualDepreciation.divide(annualWorkingHours, SCALE, RM);
        }

        // 2. Fuel cost per hour = fuelConsumptionRate * fuelPricePerLiter
        BigDecimal fuelPerHour = fuelConsumptionRate.multiply(fuelPrice).setScale(SCALE, RM);
        BigDecimal annualFuelCost = fuelPerHour.multiply(annualWorkingHours).setScale(SCALE, RM);

        // 3. Maintenance per hour = avgMonthlyMaintenanceCost * 12 / annualWorkingHours
        BigDecimal annualMaintenanceCost = orZero(vehicle.getAvgMonthlyMaintenanceCost())
                .multiply(MONTHS_IN_YEAR).setScale(SCALE, RM);
        BigDecimal maintenancePerHour = BigDecimal.ZERO;
        if (annualWorkingHours.compareTo(BigDecimal.ZERO) > 0) {
            maintenancePerHour = annualMaintenanceCost.divide(annualWorkingHours, SCALE, RM);
        }

        // 4. Insurance per hour = monthlyInsuranceCost * 12 / annualWorkingHours
        BigDecimal annualInsuranceCost = orZero(vehicle.getMonthlyInsuranceCost())
                .multiply(MONTHS_IN_YEAR).setScale(SCALE, RM);
        BigDecimal insurancePerHour = BigDecimal.ZERO;
        if (annualWorkingHours.compareTo(BigDecimal.ZERO) > 0) {
            insurancePerHour = annualInsuranceCost.divide(annualWorkingHours, SCALE, RM);
        }

        // 5. Operator per hour = monthlyOperatorCost * 12 / annualWorkingHours
        BigDecimal annualOperatorCost = orZero(vehicle.getMonthlyOperatorCost())
                .multiply(MONTHS_IN_YEAR).setScale(SCALE, RM);
        BigDecimal operatorPerHour = BigDecimal.ZERO;
        if (annualWorkingHours.compareTo(BigDecimal.ZERO) > 0) {
            operatorPerHour = annualOperatorCost.divide(annualWorkingHours, SCALE, RM);
        }

        BigDecimal totalRatePerHour = depreciationPerHour
                .add(fuelPerHour)
                .add(maintenancePerHour)
                .add(insurancePerHour)
                .add(operatorPerHour)
                .setScale(SCALE, RM);

        BigDecimal annualTotalCost = annualDepreciation
                .add(annualFuelCost)
                .add(annualMaintenanceCost)
                .add(annualInsuranceCost)
                .add(annualOperatorCost)
                .setScale(SCALE, RM);

        String vehicleName = buildVehicleName(vehicle);

        return new MachineHourRateResponse(
                vehicleId,
                vehicle.getCode(),
                vehicleName,
                purchasePrice,
                usefulLifeYears,
                annualWorkingHours,
                fuelConsumptionRate,
                fuelPrice,
                depreciationPerHour,
                fuelPerHour,
                maintenancePerHour,
                insurancePerHour,
                operatorPerHour,
                totalRatePerHour,
                annualDepreciation,
                annualFuelCost,
                annualMaintenanceCost,
                annualInsuranceCost,
                annualOperatorCost,
                annualTotalCost
        );
    }

    @Transactional(readOnly = true)
    public OwnVsRentResponse compareOwnVsRent(UUID vehicleId, BigDecimal fuelPricePerLiter) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Vehicle vehicle = getVehicleOrThrow(vehicleId, organizationId);

        MachineHourRateResponse rate = calculateRate(vehicleId, fuelPricePerLiter);

        BigDecimal annualWorkingHours = orDefault(vehicle.getAnnualWorkingHours(), new BigDecimal("1800"));
        BigDecimal monthlyWorkingHours = annualWorkingHours.divide(MONTHS_IN_YEAR, SCALE, RM);

        BigDecimal ownRatePerHour = rate.totalRatePerHour();
        BigDecimal ownMonthlyCost = ownRatePerHour.multiply(monthlyWorkingHours).setScale(SCALE, RM);
        BigDecimal ownAnnualCost = rate.annualTotalCost();

        BigDecimal marketRate = orZero(vehicle.getMarketRentalRatePerHour());
        BigDecimal rentMonthlyCost = marketRate.multiply(monthlyWorkingHours).setScale(SCALE, RM);
        BigDecimal rentAnnualCost = marketRate.multiply(annualWorkingHours).setScale(SCALE, RM);

        BigDecimal savingsPerHour = marketRate.subtract(ownRatePerHour).setScale(SCALE, RM);
        BigDecimal savingsAnnual = rentAnnualCost.subtract(ownAnnualCost).setScale(SCALE, RM);

        BigDecimal savingsPercent = BigDecimal.ZERO;
        if (rentAnnualCost.compareTo(BigDecimal.ZERO) > 0) {
            savingsPercent = savingsAnnual.multiply(new BigDecimal("100"))
                    .divide(rentAnnualCost, SCALE, RM);
        }

        String recommendation;
        int cmp = ownRatePerHour.compareTo(marketRate);
        if (cmp < 0) {
            recommendation = "OWN";
        } else if (cmp > 0) {
            recommendation = "RENT";
        } else {
            recommendation = "EQUAL";
        }

        String vehicleName = buildVehicleName(vehicle);

        return new OwnVsRentResponse(
                vehicleId,
                vehicle.getCode(),
                vehicleName,
                ownRatePerHour,
                ownMonthlyCost,
                ownAnnualCost,
                marketRate,
                rentMonthlyCost,
                rentAnnualCost,
                savingsPerHour,
                savingsAnnual,
                savingsPercent,
                recommendation
        );
    }

    private Vehicle getVehicleOrThrow(UUID vehicleId, UUID organizationId) {
        return vehicleRepository.findByIdAndOrganizationIdAndDeletedFalse(vehicleId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Техника не найдена: " + vehicleId));
    }

    private String buildVehicleName(Vehicle v) {
        if (v.getMake() != null) {
            return v.getMake() + " " + (v.getModel() != null ? v.getModel() : "") + " (" + v.getCode() + ")";
        }
        return v.getCode();
    }

    private BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal orDefault(BigDecimal value, BigDecimal defaultValue) {
        return value != null ? value : defaultValue;
    }
}
