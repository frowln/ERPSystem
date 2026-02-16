package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.IncidentSeverity;
import com.privod.platform.modules.safety.domain.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateIncidentRequest(
        @NotNull(message = "Дата инцидента обязательна")
        LocalDateTime incidentDate,

        UUID projectId,

        @Size(max = 500)
        String locationDescription,

        @NotNull(message = "Степень тяжести обязательна")
        IncidentSeverity severity,

        @NotNull(message = "Тип инцидента обязателен")
        IncidentType incidentType,

        @NotBlank(message = "Описание инцидента обязательно")
        String description,

        UUID reportedById,
        String reportedByName,

        UUID injuredEmployeeId,
        String injuredEmployeeName,

        String witnessNames,
        Integer workDaysLost,
        boolean medicalTreatment,
        boolean hospitalization,
        String notes
) {
}
