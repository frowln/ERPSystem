package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.LabTest;
import com.privod.platform.modules.pto.domain.LabTestConclusion;
import com.privod.platform.modules.pto.domain.LabTestType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LabTestResponse(
        UUID id,
        UUID projectId,
        String code,
        String materialName,
        LabTestType testType,
        String testTypeDisplayName,
        String sampleNumber,
        LocalDate testDate,
        String result,
        LabTestConclusion conclusion,
        String conclusionDisplayName,
        String protocolUrl,
        String labName,
        UUID performedById,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static LabTestResponse fromEntity(LabTest entity) {
        return new LabTestResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getCode(),
                entity.getMaterialName(),
                entity.getTestType(),
                entity.getTestType().getDisplayName(),
                entity.getSampleNumber(),
                entity.getTestDate(),
                entity.getResult(),
                entity.getConclusion(),
                entity.getConclusion().getDisplayName(),
                entity.getProtocolUrl(),
                entity.getLabName(),
                entity.getPerformedById(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
