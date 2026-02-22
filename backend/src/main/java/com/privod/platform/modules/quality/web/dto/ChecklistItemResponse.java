package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ChecklistItemResult;
import com.privod.platform.modules.quality.domain.InspectionChecklistItem;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChecklistItemResponse(
        UUID id,
        UUID qualityCheckId,
        String name,
        String description,
        ChecklistItemResult result,
        String resultDisplayName,
        String notes,
        List<String> photoUrls,
        int sortOrder,
        boolean required,
        Instant createdAt,
        Instant updatedAt
) {
    public static ChecklistItemResponse fromEntity(InspectionChecklistItem entity) {
        return new ChecklistItemResponse(
                entity.getId(),
                entity.getQualityCheckId(),
                entity.getName(),
                entity.getDescription(),
                entity.getResult(),
                entity.getResult().getDisplayName(),
                entity.getNotes(),
                entity.getPhotoUrls(),
                entity.getSortOrder(),
                entity.isRequired(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
