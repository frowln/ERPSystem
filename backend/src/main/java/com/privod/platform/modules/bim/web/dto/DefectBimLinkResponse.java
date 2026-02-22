package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.DefectBimLink;

import java.time.Instant;
import java.util.UUID;

public record DefectBimLinkResponse(
        UUID id,
        UUID defectId,
        UUID modelId,
        String elementGuid,
        String elementName,
        String elementType,
        String floorName,
        String systemName,
        Double pinX,
        Double pinY,
        Double pinZ,
        String cameraPositionJson,
        String screenshotUrl,
        String notes,
        UUID linkedByUserId,
        Instant linkedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DefectBimLinkResponse fromEntity(DefectBimLink entity) {
        return new DefectBimLinkResponse(
                entity.getId(),
                entity.getDefectId(),
                entity.getModelId(),
                entity.getElementGuid(),
                entity.getElementName(),
                entity.getElementType(),
                entity.getFloorName(),
                entity.getSystemName(),
                entity.getPinX(),
                entity.getPinY(),
                entity.getPinZ(),
                entity.getCameraPositionJson(),
                entity.getScreenshotUrl(),
                entity.getNotes(),
                entity.getLinkedByUserId(),
                entity.getLinkedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
