package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.EquipmentInspection;
import com.privod.platform.modules.fleet.domain.InspectionRating;
import com.privod.platform.modules.fleet.domain.InspectionType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EquipmentInspectionResponse(
        UUID id,
        UUID vehicleId,
        UUID inspectorId,
        LocalDate inspectionDate,
        InspectionType inspectionType,
        String inspectionTypeDisplayName,
        InspectionRating overallRating,
        String overallRatingDisplayName,
        String findings,
        String recommendations,
        LocalDate nextInspectionDate,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static EquipmentInspectionResponse fromEntity(EquipmentInspection inspection) {
        return new EquipmentInspectionResponse(
                inspection.getId(),
                inspection.getVehicleId(),
                inspection.getInspectorId(),
                inspection.getInspectionDate(),
                inspection.getInspectionType(),
                inspection.getInspectionType().getDisplayName(),
                inspection.getOverallRating(),
                inspection.getOverallRating().getDisplayName(),
                inspection.getFindings(),
                inspection.getRecommendations(),
                inspection.getNextInspectionDate(),
                inspection.getCreatedAt(),
                inspection.getUpdatedAt(),
                inspection.getCreatedBy()
        );
    }
}
