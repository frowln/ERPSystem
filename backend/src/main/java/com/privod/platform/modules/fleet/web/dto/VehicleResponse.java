package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.FuelType;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.domain.VehicleType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record VehicleResponse(
        UUID id,
        String code,
        String licensePlate,
        String make,
        String model,
        Integer year,
        String vin,
        VehicleType vehicleType,
        String vehicleTypeDisplayName,
        VehicleStatus status,
        String statusDisplayName,
        UUID currentProjectId,
        UUID currentLocationId,
        UUID responsibleId,
        LocalDate purchaseDate,
        BigDecimal purchasePrice,
        BigDecimal currentValue,
        BigDecimal depreciationRate,
        FuelType fuelType,
        String fuelTypeDisplayName,
        BigDecimal fuelConsumptionRate,
        BigDecimal currentMileage,
        BigDecimal currentHours,
        LocalDate insuranceExpiryDate,
        LocalDate techInspectionExpiryDate,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static VehicleResponse fromEntity(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getCode(),
                vehicle.getLicensePlate(),
                vehicle.getMake(),
                vehicle.getModel(),
                vehicle.getYear(),
                vehicle.getVin(),
                vehicle.getVehicleType(),
                vehicle.getVehicleType().getDisplayName(),
                vehicle.getStatus(),
                vehicle.getStatus().getDisplayName(),
                vehicle.getCurrentProjectId(),
                vehicle.getCurrentLocationId(),
                vehicle.getResponsibleId(),
                vehicle.getPurchaseDate(),
                vehicle.getPurchasePrice(),
                vehicle.getCurrentValue(),
                vehicle.getDepreciationRate(),
                vehicle.getFuelType(),
                vehicle.getFuelType() != null ? vehicle.getFuelType().getDisplayName() : null,
                vehicle.getFuelConsumptionRate(),
                vehicle.getCurrentMileage(),
                vehicle.getCurrentHours(),
                vehicle.getInsuranceExpiryDate(),
                vehicle.getTechInspectionExpiryDate(),
                vehicle.getNotes(),
                vehicle.getCreatedAt(),
                vehicle.getUpdatedAt(),
                vehicle.getCreatedBy()
        );
    }
}
