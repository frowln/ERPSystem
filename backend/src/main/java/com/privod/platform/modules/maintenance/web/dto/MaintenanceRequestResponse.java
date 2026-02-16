package com.privod.platform.modules.maintenance.web.dto;

import com.privod.platform.modules.maintenance.domain.MaintenancePriority;
import com.privod.platform.modules.maintenance.domain.MaintenanceRequest;
import com.privod.platform.modules.maintenance.domain.MaintenanceType;
import com.privod.platform.modules.maintenance.domain.RequestStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MaintenanceRequestResponse(
        UUID id,
        String name,
        String description,
        LocalDate requestDate,
        UUID equipmentId,
        String equipmentName,
        UUID maintenanceTeamId,
        UUID responsibleId,
        UUID stageId,
        MaintenancePriority priority,
        String priorityDisplayName,
        MaintenanceType maintenanceType,
        String maintenanceTypeDisplayName,
        BigDecimal duration,
        LocalDate scheduledDate,
        LocalDate completedDate,
        String notes,
        BigDecimal cost,
        RequestStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MaintenanceRequestResponse fromEntity(MaintenanceRequest request) {
        return new MaintenanceRequestResponse(
                request.getId(),
                request.getName(),
                request.getDescription(),
                request.getRequestDate(),
                request.getEquipmentId(),
                request.getEquipmentName(),
                request.getMaintenanceTeamId(),
                request.getResponsibleId(),
                request.getStageId(),
                request.getPriority(),
                request.getPriority().getDisplayName(),
                request.getMaintenanceType(),
                request.getMaintenanceType().getDisplayName(),
                request.getDuration(),
                request.getScheduledDate(),
                request.getCompletedDate(),
                request.getNotes(),
                request.getCost(),
                request.getStatus(),
                request.getStatus().getDisplayName(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                request.getCreatedBy()
        );
    }
}
