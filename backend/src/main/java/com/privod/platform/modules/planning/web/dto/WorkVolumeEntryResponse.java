package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.WorkVolumeEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record WorkVolumeEntryResponse(
        UUID id,
        UUID projectId,
        UUID wbsNodeId,
        LocalDate recordDate,
        BigDecimal quantity,
        String unitOfMeasure,
        String description,
        String notes,
        UUID creatorId,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkVolumeEntryResponse fromEntity(WorkVolumeEntry entry) {
        return new WorkVolumeEntryResponse(
                entry.getId(),
                entry.getProjectId(),
                entry.getWbsNodeId(),
                entry.getRecordDate(),
                entry.getQuantity(),
                entry.getUnitOfMeasure(),
                entry.getDescription(),
                entry.getNotes(),
                entry.getCreatorId(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
