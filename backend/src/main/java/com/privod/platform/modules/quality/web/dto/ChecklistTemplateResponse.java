package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ChecklistTemplate;
import com.privod.platform.modules.quality.domain.ChecklistWorkType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChecklistTemplateResponse(
        UUID id,
        String name,
        ChecklistWorkType workType,
        String workTypeDisplayName,
        List<Object> items,
        Instant createdAt,
        Instant updatedAt
) {
    public static ChecklistTemplateResponse fromEntity(ChecklistTemplate entity) {
        return new ChecklistTemplateResponse(
                entity.getId(),
                entity.getName(),
                entity.getWorkType(),
                entity.getWorkType().getDisplayName(),
                entity.getItems(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
