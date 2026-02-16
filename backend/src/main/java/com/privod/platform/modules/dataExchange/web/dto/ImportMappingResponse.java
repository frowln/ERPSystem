package com.privod.platform.modules.dataExchange.web.dto;

import com.privod.platform.modules.dataExchange.domain.ImportMapping;

import java.time.Instant;
import java.util.UUID;

public record ImportMappingResponse(
        UUID id,
        String name,
        String entityType,
        String mappingConfig,
        Boolean isDefault,
        UUID createdById,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ImportMappingResponse fromEntity(ImportMapping entity) {
        return new ImportMappingResponse(
                entity.getId(),
                entity.getName(),
                entity.getEntityType(),
                entity.getMappingConfig(),
                entity.getIsDefault(),
                entity.getCreatedById(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
