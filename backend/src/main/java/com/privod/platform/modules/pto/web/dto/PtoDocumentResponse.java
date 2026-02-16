package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.Discipline;
import com.privod.platform.modules.pto.domain.PtoDocument;
import com.privod.platform.modules.pto.domain.PtoDocumentStatus;
import com.privod.platform.modules.pto.domain.PtoDocumentType;

import java.time.Instant;
import java.util.UUID;

public record PtoDocumentResponse(
        UUID id,
        UUID projectId,
        String code,
        String title,
        PtoDocumentType documentType,
        String documentTypeDisplayName,
        Discipline discipline,
        String disciplineDisplayName,
        PtoDocumentStatus status,
        String statusDisplayName,
        Integer currentVersion,
        UUID approvedById,
        Instant approvedAt,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PtoDocumentResponse fromEntity(PtoDocument entity) {
        return new PtoDocumentResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getCode(),
                entity.getTitle(),
                entity.getDocumentType(),
                entity.getDocumentType().getDisplayName(),
                entity.getDiscipline(),
                entity.getDiscipline() != null ? entity.getDiscipline().getDisplayName() : null,
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCurrentVersion(),
                entity.getApprovedById(),
                entity.getApprovedAt(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
