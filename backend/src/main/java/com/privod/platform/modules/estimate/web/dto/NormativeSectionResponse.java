package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.NormativeSection;

import java.time.Instant;
import java.util.UUID;

public record NormativeSectionResponse(
        UUID id,
        UUID databaseId,
        UUID parentId,
        String code,
        String name,
        int level,
        int sortOrder,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static NormativeSectionResponse fromEntity(NormativeSection entity) {
        return new NormativeSectionResponse(
                entity.getId(),
                entity.getDatabaseId(),
                entity.getParentId(),
                entity.getCode(),
                entity.getName(),
                entity.getLevel(),
                entity.getSortOrder(),
                entity.getDescription(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
