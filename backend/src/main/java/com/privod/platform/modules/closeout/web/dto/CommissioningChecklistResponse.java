package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.ChecklistStatus;
import com.privod.platform.modules.closeout.domain.CommissioningChecklist;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CommissioningChecklistResponse(
        UUID id,
        UUID projectId,
        String name,
        String system,
        ChecklistStatus status,
        String statusDisplayName,
        String checkItems,
        UUID inspectorId,
        LocalDate inspectionDate,
        UUID signedOffById,
        Instant signedOffAt,
        String notes,
        String attachmentIds,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static CommissioningChecklistResponse fromEntity(CommissioningChecklist entity) {
        return new CommissioningChecklistResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getSystem(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCheckItems(),
                entity.getInspectorId(),
                entity.getInspectionDate(),
                entity.getSignedOffById(),
                entity.getSignedOffAt(),
                entity.getNotes(),
                entity.getAttachmentIds(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
