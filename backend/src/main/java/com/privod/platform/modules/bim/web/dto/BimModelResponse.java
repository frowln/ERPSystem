package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.BimModel;
import com.privod.platform.modules.bim.domain.BimModelFormat;
import com.privod.platform.modules.bim.domain.BimModelStatus;
import com.privod.platform.modules.bim.domain.BimModelType;

import java.time.Instant;
import java.util.UUID;

public record BimModelResponse(
        UUID id,
        String name,
        UUID projectId,
        BimModelType modelType,
        String modelTypeDisplayName,
        BimModelFormat format,
        String formatDisplayName,
        String fileUrl,
        Long fileSize,
        String description,
        BimModelStatus status,
        String statusDisplayName,
        UUID uploadedById,
        Integer elementCount,
        Integer modelVersion,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static BimModelResponse fromEntity(BimModel entity) {
        return new BimModelResponse(
                entity.getId(),
                entity.getName(),
                entity.getProjectId(),
                entity.getModelType(),
                entity.getModelType().getDisplayName(),
                entity.getFormat(),
                entity.getFormat().getDisplayName(),
                entity.getFileUrl(),
                entity.getFileSize(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getUploadedById(),
                entity.getElementCount(),
                entity.getModelVersion(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
