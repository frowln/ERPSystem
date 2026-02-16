package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.InspectionRating;
import com.privod.platform.modules.safety.domain.InspectionStatus;
import com.privod.platform.modules.safety.domain.InspectionType;
import com.privod.platform.modules.safety.domain.SafetyInspection;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record InspectionResponse(
        UUID id,
        String number,
        LocalDate inspectionDate,
        UUID projectId,
        UUID inspectorId,
        String inspectorName,
        InspectionType inspectionType,
        String inspectionTypeDisplayName,
        InspectionStatus status,
        String statusDisplayName,
        InspectionRating overallRating,
        String overallRatingDisplayName,
        String findings,
        String recommendations,
        LocalDate nextInspectionDate,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static InspectionResponse fromEntity(SafetyInspection inspection) {
        return new InspectionResponse(
                inspection.getId(),
                inspection.getNumber(),
                inspection.getInspectionDate(),
                inspection.getProjectId(),
                inspection.getInspectorId(),
                inspection.getInspectorName(),
                inspection.getInspectionType(),
                inspection.getInspectionType().getDisplayName(),
                inspection.getStatus(),
                inspection.getStatus().getDisplayName(),
                inspection.getOverallRating(),
                inspection.getOverallRating() != null ? inspection.getOverallRating().getDisplayName() : null,
                inspection.getFindings(),
                inspection.getRecommendations(),
                inspection.getNextInspectionDate(),
                inspection.getNotes(),
                inspection.getCreatedAt(),
                inspection.getUpdatedAt(),
                inspection.getCreatedBy()
        );
    }
}
