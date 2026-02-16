package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.EdoDocumentStatus;
import com.privod.platform.modules.russianDoc.domain.EdoGeneratedDocument;

import java.time.Instant;
import java.util.UUID;

public record EdoGeneratedDocumentResponse(
        UUID id,
        UUID templateId,
        String sourceDocumentType,
        UUID sourceDocumentId,
        String generatedXml,
        String generatedPdfUrl,
        EdoDocumentStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static EdoGeneratedDocumentResponse fromEntity(EdoGeneratedDocument entity) {
        return new EdoGeneratedDocumentResponse(
                entity.getId(),
                entity.getTemplate() != null ? entity.getTemplate().getId() : null,
                entity.getSourceDocumentType(),
                entity.getSourceDocumentId(),
                entity.getGeneratedXml(),
                entity.getGeneratedPdfUrl(),
                entity.getStatus(),
                entity.getStatus() != null ? entity.getStatus().getDisplayName() : null,
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
