package com.privod.platform.modules.maintenance.web.dto;

import com.privod.platform.modules.maintenance.domain.MaintenancePriority;
import com.privod.platform.modules.maintenance.domain.MaintenanceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateMaintenanceRequest(
        @NotBlank(message = "Request name is required")
        @Size(max = 500, message = "Name must not exceed 500 characters")
        String name,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        @NotNull(message = "Request date is required")
        LocalDate requestDate,

        UUID equipmentId,

        @Size(max = 300)
        String equipmentName,

        UUID maintenanceTeamId,

        UUID responsibleId,

        UUID stageId,

        MaintenancePriority priority,

        MaintenanceType maintenanceType,

        @Positive(message = "Duration must be positive")
        BigDecimal duration,

        LocalDate scheduledDate,

        String notes,

        @Positive(message = "Cost must be positive")
        BigDecimal cost
) {
}
