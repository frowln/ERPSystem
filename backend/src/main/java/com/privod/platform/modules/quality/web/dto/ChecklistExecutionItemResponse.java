package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ChecklistExecutionItem;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChecklistExecutionItemResponse(
        UUID id,
        UUID checklistId,
        String description,
        String category,
        boolean required,
        String result,
        String resultDisplayName,
        boolean photoRequired,
        List<String> photoUrls,
        String notes,
        UUID inspectorId,
        String inspectorName,
        Instant inspectedAt,
        int sortOrder
) {
    public static ChecklistExecutionItemResponse fromEntity(ChecklistExecutionItem entity) {
        return new ChecklistExecutionItemResponse(
                entity.getId(),
                entity.getChecklistId(),
                entity.getDescription(),
                entity.getCategory(),
                entity.isRequired(),
                entity.getResult().name(),
                entity.getResult().getDisplayName(),
                entity.isPhotoRequired(),
                entity.getPhotoUrls(),
                entity.getNotes(),
                entity.getInspectorId(),
                entity.getInspectorName(),
                entity.getInspectedAt(),
                entity.getSortOrder()
        );
    }
}
