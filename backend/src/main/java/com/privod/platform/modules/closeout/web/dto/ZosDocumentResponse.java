package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.ZosDocument;

import java.time.Instant;
import java.util.UUID;

public record ZosDocumentResponse(
        UUID id,
        UUID projectId,
        String documentNumber,
        String title,
        String system,
        String checklistIds,
        String issuedDate,
        String issuedByName,
        String issuedByOrganization,
        String status,
        String statusDisplayName,
        String conclusionText,
        String remarks,
        String attachmentIds,
        Instant createdAt
) {
    public static ZosDocumentResponse fromEntity(ZosDocument entity) {
        return new ZosDocumentResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getDocumentNumber(),
                entity.getTitle(),
                entity.getSystem(),
                entity.getChecklistIds(),
                entity.getIssuedDate() != null ? entity.getIssuedDate().toString() : null,
                entity.getIssuedByName(),
                entity.getIssuedByOrganization(),
                entity.getStatus().name(),
                entity.getStatus().getDisplayName(),
                entity.getConclusionText(),
                entity.getRemarks(),
                entity.getAttachmentIds(),
                entity.getCreatedAt()
        );
    }
}
