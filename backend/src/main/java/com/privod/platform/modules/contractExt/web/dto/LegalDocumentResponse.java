package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.LegalDocument;

import java.time.Instant;
import java.util.UUID;

public record LegalDocumentResponse(
        UUID id,
        UUID caseId,
        String title,
        String documentType,
        String fileUrl,
        UUID uploadedById,
        Instant uploadedAt,
        Instant createdAt
) {
    public static LegalDocumentResponse fromEntity(LegalDocument entity) {
        return new LegalDocumentResponse(
                entity.getId(),
                entity.getCaseId(),
                entity.getTitle(),
                entity.getDocumentType(),
                entity.getFileUrl(),
                entity.getUploadedById(),
                entity.getUploadedAt(),
                entity.getCreatedAt()
        );
    }
}
