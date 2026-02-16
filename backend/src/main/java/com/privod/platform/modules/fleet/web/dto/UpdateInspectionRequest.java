package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.InspectionRating;
import com.privod.platform.modules.fleet.domain.InspectionType;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateInspectionRequest(
        UUID inspectorId,
        LocalDate inspectionDate,
        InspectionType inspectionType,
        InspectionRating overallRating,
        String findings,
        String recommendations,
        LocalDate nextInspectionDate
) {
}
