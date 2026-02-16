package com.privod.platform.modules.maintenance.web.dto;

import com.privod.platform.modules.maintenance.domain.FrequencyType;
import com.privod.platform.modules.maintenance.domain.PreventiveSchedule;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PreventiveScheduleResponse(
        UUID id,
        UUID equipmentId,
        UUID maintenanceTeamId,
        String name,
        FrequencyType frequencyType,
        String frequencyTypeDisplayName,
        int frequencyInterval,
        LocalDate nextExecution,
        LocalDate lastExecution,
        boolean isActive,
        String description,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PreventiveScheduleResponse fromEntity(PreventiveSchedule schedule) {
        return new PreventiveScheduleResponse(
                schedule.getId(),
                schedule.getEquipmentId(),
                schedule.getMaintenanceTeamId(),
                schedule.getName(),
                schedule.getFrequencyType(),
                schedule.getFrequencyType().getDisplayName(),
                schedule.getFrequencyInterval(),
                schedule.getNextExecution(),
                schedule.getLastExecution(),
                schedule.isActive(),
                schedule.getDescription(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt(),
                schedule.getCreatedBy()
        );
    }
}
