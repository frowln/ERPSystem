package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.FuelRecord;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FuelRecordResponse(
        UUID id,
        UUID vehicleId,
        UUID operatorId,
        UUID projectId,
        LocalDate fuelDate,
        BigDecimal quantity,
        BigDecimal pricePerUnit,
        BigDecimal totalCost,
        BigDecimal mileageAtFuel,
        BigDecimal hoursAtFuel,
        String fuelStation,
        String receiptNumber,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static FuelRecordResponse fromEntity(FuelRecord record) {
        return new FuelRecordResponse(
                record.getId(),
                record.getVehicleId(),
                record.getOperatorId(),
                record.getProjectId(),
                record.getFuelDate(),
                record.getQuantity(),
                record.getPricePerUnit(),
                record.getTotalCost(),
                record.getMileageAtFuel(),
                record.getHoursAtFuel(),
                record.getFuelStation(),
                record.getReceiptNumber(),
                record.getCreatedAt(),
                record.getUpdatedAt(),
                record.getCreatedBy()
        );
    }
}
