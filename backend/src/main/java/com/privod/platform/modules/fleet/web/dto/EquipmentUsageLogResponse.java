package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.EquipmentUsageLog;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EquipmentUsageLogResponse(
        UUID id,
        UUID vehicleId,
        String vehicleName,
        UUID projectId,
        String projectName,
        UUID operatorId,
        String operatorName,
        LocalDate usageDate,
        BigDecimal hoursWorked,
        BigDecimal hoursStart,
        BigDecimal hoursEnd,
        BigDecimal fuelConsumed,
        String description,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static EquipmentUsageLogResponse fromEntity(EquipmentUsageLog log) {
        return fromEntity(log, null, null);
    }

    public static EquipmentUsageLogResponse fromEntity(EquipmentUsageLog log,
                                                        String vehicleName,
                                                        String projectName) {
        return new EquipmentUsageLogResponse(
                log.getId(),
                log.getVehicleId(),
                vehicleName,
                log.getProjectId(),
                projectName,
                log.getOperatorId(),
                log.getOperatorName(),
                log.getUsageDate(),
                log.getHoursWorked(),
                log.getHoursStart(),
                log.getHoursEnd(),
                log.getFuelConsumed(),
                log.getDescription(),
                log.getNotes(),
                log.getCreatedAt(),
                log.getUpdatedAt(),
                log.getCreatedBy()
        );
    }
}
