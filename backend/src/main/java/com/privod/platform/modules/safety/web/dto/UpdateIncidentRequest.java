package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.IncidentSeverity;
import com.privod.platform.modules.safety.domain.IncidentType;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record UpdateIncidentRequest(
        LocalDateTime incidentDate,
        UUID projectId,

        @Size(max = 500)
        String locationDescription,

        IncidentSeverity severity,
        IncidentType incidentType,
        String description,
        String rootCause,
        String correctiveAction,
        UUID reportedById,
        String reportedByName,
        UUID investigatorId,
        String investigatorName,
        UUID injuredEmployeeId,
        String injuredEmployeeName,
        String witnessNames,
        Integer workDaysLost,
        Boolean medicalTreatment,
        Boolean hospitalization,
        String notes
) {
}
