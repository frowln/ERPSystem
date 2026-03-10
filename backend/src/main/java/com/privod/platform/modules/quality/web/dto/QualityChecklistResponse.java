package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.QualityChecklist;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record QualityChecklistResponse(
        UUID id,
        String code,
        String name,
        UUID projectId,
        String workType,
        String workTypeDisplayName,
        String wbsStage,
        String location,
        String status,
        String statusDisplayName,
        UUID inspectorId,
        String inspectorName,
        LocalDate scheduledDate,
        LocalDate completedDate,
        int totalItems,
        int passedItems,
        int failedItems,
        int naItems,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static QualityChecklistResponse fromEntity(QualityChecklist entity) {
        return new QualityChecklistResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getProjectId(),
                entity.getWorkType().name(),
                entity.getWorkType().getDisplayName(),
                entity.getWbsStage(),
                entity.getLocation(),
                entity.getStatus().name(),
                entity.getStatus().getDisplayName(),
                entity.getInspectorId(),
                entity.getInspectorName(),
                entity.getScheduledDate(),
                entity.getCompletedDate(),
                entity.getTotalItems(),
                entity.getPassedItems(),
                entity.getFailedItems(),
                entity.getNaItems(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
