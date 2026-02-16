package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.SafetyViolation;
import com.privod.platform.modules.safety.domain.ViolationSeverity;
import com.privod.platform.modules.safety.domain.ViolationStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ViolationResponse(
        UUID id,
        UUID inspectionId,
        UUID incidentId,
        String description,
        ViolationSeverity severity,
        String severityDisplayName,
        ViolationStatus status,
        String statusDisplayName,
        LocalDate dueDate,
        UUID assignedToId,
        String assignedToName,
        Instant resolvedAt,
        String resolution,
        Instant createdAt,
        Instant updatedAt
) {
    public static ViolationResponse fromEntity(SafetyViolation violation) {
        return new ViolationResponse(
                violation.getId(),
                violation.getInspectionId(),
                violation.getIncidentId(),
                violation.getDescription(),
                violation.getSeverity(),
                violation.getSeverity().getDisplayName(),
                violation.getStatus(),
                violation.getStatus().getDisplayName(),
                violation.getDueDate(),
                violation.getAssignedToId(),
                violation.getAssignedToName(),
                violation.getResolvedAt(),
                violation.getResolution(),
                violation.getCreatedAt(),
                violation.getUpdatedAt()
        );
    }
}
