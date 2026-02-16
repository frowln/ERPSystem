package com.privod.platform.modules.dataExchange.web.dto;

import com.privod.platform.modules.dataExchange.domain.ExportFormat;
import com.privod.platform.modules.dataExchange.domain.ExportJob;

import java.time.Instant;
import java.util.UUID;

public record ExportJobResponse(
        UUID id,
        String entityType,
        ExportFormat format,
        String formatDisplayName,
        String fileName,
        String filters,
        Integer totalRows,
        String status,
        Instant startedAt,
        Instant completedAt,
        String fileUrl,
        UUID requestedById,
        UUID projectId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ExportJobResponse fromEntity(ExportJob entity) {
        return new ExportJobResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getFormat(),
                entity.getFormat() != null ? entity.getFormat().getDisplayName() : null,
                entity.getFileName(),
                entity.getFilters(),
                entity.getTotalRows(),
                entity.getStatus(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getFileUrl(),
                entity.getRequestedById(),
                entity.getProjectId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
