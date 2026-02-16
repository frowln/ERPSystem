package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.InspectionRating;
import com.privod.platform.modules.safety.domain.InspectionStatus;
import com.privod.platform.modules.safety.domain.InspectionType;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateInspectionRequest(
        LocalDate inspectionDate,
        UUID projectId,
        UUID inspectorId,
        String inspectorName,
        InspectionType inspectionType,
        InspectionStatus status,
        InspectionRating overallRating,
        String findings,
        String recommendations,
        LocalDate nextInspectionDate,
        String notes
) {
}
