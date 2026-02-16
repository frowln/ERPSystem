package com.privod.platform.modules.report.web.dto;

import com.privod.platform.modules.report.domain.PrintForm;

import java.time.Instant;
import java.util.UUID;

public record PrintFormResponse(
        UUID id,
        String code,
        String name,
        String entityType,
        UUID templateId,
        boolean isDefault,
        int sortOrder,
        boolean isActive,
        Instant createdAt
) {
    public static PrintFormResponse fromEntity(PrintForm entity) {
        return new PrintFormResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getEntityType(),
                entity.getTemplateId(),
                entity.isDefault(),
                entity.getSortOrder(),
                entity.isActive(),
                entity.getCreatedAt()
        );
    }
}
