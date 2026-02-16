package com.privod.platform.modules.report.web.dto;

import com.privod.platform.modules.report.domain.GeneratedReport;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record GeneratedReportResponse(
        UUID id,
        UUID templateId,
        String entityType,
        UUID entityId,
        Map<String, Object> parameters,
        String fileUrl,
        long fileSize,
        UUID generatedById,
        Instant generatedAt,
        Instant createdAt
) {
    public static GeneratedReportResponse fromEntity(GeneratedReport entity) {
        return new GeneratedReportResponse(
                entity.getId(),
                entity.getTemplateId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getParameters(),
                entity.getFileUrl(),
                entity.getFileSize(),
                entity.getGeneratedById(),
                entity.getGeneratedAt(),
                entity.getCreatedAt()
        );
    }
}
