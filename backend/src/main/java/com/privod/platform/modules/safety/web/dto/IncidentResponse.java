package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.IncidentSeverity;
import com.privod.platform.modules.safety.domain.IncidentStatus;
import com.privod.platform.modules.safety.domain.IncidentType;
import com.privod.platform.modules.safety.domain.SafetyIncident;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record IncidentResponse(
        UUID id,
        String number,
        LocalDateTime incidentDate,
        UUID projectId,
        String locationDescription,
        IncidentSeverity severity,
        String severityDisplayName,
        IncidentType incidentType,
        String incidentTypeDisplayName,
        IncidentStatus status,
        String statusDisplayName,
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
        boolean medicalTreatment,
        boolean hospitalization,
        Instant resolvedAt,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static IncidentResponse fromEntity(SafetyIncident incident) {
        return new IncidentResponse(
                incident.getId(),
                incident.getNumber(),
                incident.getIncidentDate(),
                incident.getProjectId(),
                incident.getLocationDescription(),
                incident.getSeverity(),
                incident.getSeverity().getDisplayName(),
                incident.getIncidentType(),
                incident.getIncidentType().getDisplayName(),
                incident.getStatus(),
                incident.getStatus().getDisplayName(),
                incident.getDescription(),
                incident.getRootCause(),
                incident.getCorrectiveAction(),
                incident.getReportedById(),
                incident.getReportedByName(),
                incident.getInvestigatorId(),
                incident.getInvestigatorName(),
                incident.getInjuredEmployeeId(),
                incident.getInjuredEmployeeName(),
                incident.getWitnessNames(),
                incident.getWorkDaysLost(),
                incident.isMedicalTreatment(),
                incident.isHospitalization(),
                incident.getResolvedAt(),
                incident.getNotes(),
                incident.getCreatedAt(),
                incident.getUpdatedAt(),
                incident.getCreatedBy()
        );
    }
}
