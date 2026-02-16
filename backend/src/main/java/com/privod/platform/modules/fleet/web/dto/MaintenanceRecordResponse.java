package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.MaintenanceRecord;
import com.privod.platform.modules.fleet.domain.MaintenanceStatus;
import com.privod.platform.modules.fleet.domain.MaintenanceType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MaintenanceRecordResponse(
        UUID id,
        UUID vehicleId,
        MaintenanceType maintenanceType,
        String maintenanceTypeDisplayName,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        MaintenanceStatus status,
        String statusDisplayName,
        BigDecimal cost,
        UUID performedById,
        String vendor,
        BigDecimal mileageAtService,
        BigDecimal hoursAtService,
        BigDecimal nextServiceMileage,
        BigDecimal nextServiceHours,
        LocalDate nextServiceDate,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MaintenanceRecordResponse fromEntity(MaintenanceRecord record) {
        return new MaintenanceRecordResponse(
                record.getId(),
                record.getVehicleId(),
                record.getMaintenanceType(),
                record.getMaintenanceType().getDisplayName(),
                record.getDescription(),
                record.getStartDate(),
                record.getEndDate(),
                record.getStatus(),
                record.getStatus().getDisplayName(),
                record.getCost(),
                record.getPerformedById(),
                record.getVendor(),
                record.getMileageAtService(),
                record.getHoursAtService(),
                record.getNextServiceMileage(),
                record.getNextServiceHours(),
                record.getNextServiceDate(),
                record.getCreatedAt(),
                record.getUpdatedAt(),
                record.getCreatedBy()
        );
    }
}
