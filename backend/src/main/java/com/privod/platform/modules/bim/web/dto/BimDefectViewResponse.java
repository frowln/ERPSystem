package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.BimDefectView;

import java.time.Instant;
import java.util.UUID;

public record BimDefectViewResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        UUID modelId,
        String filterFloor,
        String filterSystem,
        String filterDefectStatus,
        String cameraPresetJson,
        String elementGuidsJson,
        Boolean isShared,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static BimDefectViewResponse fromEntity(BimDefectView entity) {
        return new BimDefectViewResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getDescription(),
                entity.getModelId(),
                entity.getFilterFloor(),
                entity.getFilterSystem(),
                entity.getFilterDefectStatus(),
                entity.getCameraPresetJson(),
                entity.getElementGuidsJson(),
                entity.getIsShared(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
