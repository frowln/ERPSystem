package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.MaintenanceScheduleRule;
import com.privod.platform.modules.fleet.domain.MaintenanceType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ScheduleRuleResponse(
        UUID id,
        UUID vehicleId,
        String vehicleName,
        String name,
        String description,
        MaintenanceType maintenanceType,
        String maintenanceTypeDisplayName,
        BigDecimal intervalHours,
        BigDecimal intervalMileage,
        Integer intervalDays,
        BigDecimal leadTimeHours,
        BigDecimal leadTimeMileage,
        Integer leadTimeDays,
        Boolean isActive,
        Boolean appliesToAllVehicles,
        Instant lastTriggeredAt,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static ScheduleRuleResponse fromEntity(MaintenanceScheduleRule rule) {
        return fromEntity(rule, null);
    }

    public static ScheduleRuleResponse fromEntity(MaintenanceScheduleRule rule, String vehicleName) {
        return new ScheduleRuleResponse(
                rule.getId(),
                rule.getVehicleId(),
                vehicleName,
                rule.getName(),
                rule.getDescription(),
                rule.getMaintenanceType(),
                rule.getMaintenanceType().getDisplayName(),
                rule.getIntervalHours(),
                rule.getIntervalMileage(),
                rule.getIntervalDays(),
                rule.getLeadTimeHours(),
                rule.getLeadTimeMileage(),
                rule.getLeadTimeDays(),
                rule.getIsActive(),
                rule.getAppliesToAllVehicles(),
                rule.getLastTriggeredAt(),
                rule.getNotes(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }
}
