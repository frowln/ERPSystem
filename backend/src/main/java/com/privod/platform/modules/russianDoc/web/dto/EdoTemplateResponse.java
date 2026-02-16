package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.EdoTemplate;

import java.time.Instant;
import java.util.UUID;

public record EdoTemplateResponse(
        UUID id,
        String code,
        String name,
        String documentType,
        String templateXml,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static EdoTemplateResponse fromEntity(EdoTemplate entity) {
        return new EdoTemplateResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDocumentType(),
                entity.getTemplateXml(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
