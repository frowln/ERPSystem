package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.InspectionResult;
import com.privod.platform.modules.regulatory.domain.RegulatoryInspection;
import com.privod.platform.modules.regulatory.domain.RegulatoryInspectionType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RegulatoryInspectionResponse(
        UUID id,
        UUID projectId,
        LocalDate inspectionDate,
        String inspectorName,
        String inspectorOrgan,
        RegulatoryInspectionType inspectionType,
        String inspectionTypeDisplayName,
        InspectionResult result,
        String resultDisplayName,
        String violations,
        String prescriptionsJson,
        LocalDate deadlineToFix,
        String actNumber,
        String actUrl,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static RegulatoryInspectionResponse fromEntity(RegulatoryInspection inspection) {
        return new RegulatoryInspectionResponse(
                inspection.getId(),
                inspection.getProjectId(),
                inspection.getInspectionDate(),
                inspection.getInspectorName(),
                inspection.getInspectorOrgan(),
                inspection.getInspectionType(),
                inspection.getInspectionType().getDisplayName(),
                inspection.getResult(),
                inspection.getResult() != null ? inspection.getResult().getDisplayName() : null,
                inspection.getViolations(),
                inspection.getPrescriptionsJson(),
                inspection.getDeadlineToFix(),
                inspection.getActNumber(),
                inspection.getActUrl(),
                inspection.getCreatedAt(),
                inspection.getUpdatedAt(),
                inspection.getCreatedBy()
        );
    }
}
