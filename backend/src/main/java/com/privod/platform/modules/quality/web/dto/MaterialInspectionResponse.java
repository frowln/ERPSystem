package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.MaterialInspection;
import com.privod.platform.modules.quality.domain.MaterialInspectionResult;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MaterialInspectionResponse(
        UUID id,
        String number,
        String materialName,
        String supplier,
        String batchNumber,
        LocalDate inspectionDate,
        String inspectorName,
        MaterialInspectionResult result,
        String testProtocolNumber,
        List<Object> testResults,
        String notes,
        UUID projectId,
        String projectName,
        Instant createdAt,
        Instant updatedAt
) {
    public static MaterialInspectionResponse fromEntity(MaterialInspection entity) {
        return fromEntity(entity, null);
    }

    public static MaterialInspectionResponse fromEntity(MaterialInspection entity, String projectName) {
        return new MaterialInspectionResponse(
                entity.getId(),
                entity.getNumber(),
                entity.getMaterialName(),
                entity.getSupplier(),
                entity.getBatchNumber(),
                entity.getInspectionDate(),
                entity.getInspectorName(),
                entity.getResult(),
                entity.getTestProtocolNumber(),
                entity.getTestResults(),
                entity.getNotes(),
                entity.getProjectId(),
                projectName,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
