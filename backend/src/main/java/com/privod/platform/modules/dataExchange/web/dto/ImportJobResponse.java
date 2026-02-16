package com.privod.platform.modules.dataExchange.web.dto;

import com.privod.platform.modules.dataExchange.domain.ImportJob;
import com.privod.platform.modules.dataExchange.domain.ImportStatus;

import java.time.Instant;
import java.util.UUID;

public record ImportJobResponse(
        UUID id,
        String entityType,
        String fileName,
        Long fileSize,
        ImportStatus status,
        String statusDisplayName,
        Integer totalRows,
        Integer processedRows,
        Integer successRows,
        Integer errorRows,
        String errors,
        UUID mappingId,
        Instant startedAt,
        Instant completedAt,
        UUID startedById,
        UUID projectId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ImportJobResponse fromEntity(ImportJob entity) {
        return new ImportJobResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getFileName(),
                entity.getFileSize(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getTotalRows(),
                entity.getProcessedRows(),
                entity.getSuccessRows(),
                entity.getErrorRows(),
                entity.getErrors(),
                entity.getMappingId(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getStartedById(),
                entity.getProjectId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
