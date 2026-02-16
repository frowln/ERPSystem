package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.DocumentRevision;
import com.privod.platform.modules.cde.domain.RevisionStatus;

import java.time.Instant;
import java.util.UUID;

public record DocumentRevisionResponse(
        UUID id,
        UUID documentContainerId,
        String revisionNumber,
        RevisionStatus revisionStatus,
        String revisionStatusDisplayName,
        String description,
        UUID fileId,
        String fileName,
        Long fileSize,
        String mimeType,
        UUID uploadedById,
        Instant uploadedAt,
        UUID approvedById,
        Instant approvedAt,
        UUID supersededById,
        Instant supersededAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static DocumentRevisionResponse fromEntity(DocumentRevision entity) {
        return new DocumentRevisionResponse(
                entity.getId(),
                entity.getDocumentContainerId(),
                entity.getRevisionNumber(),
                entity.getRevisionStatus(),
                entity.getRevisionStatus().getDisplayName(),
                entity.getDescription(),
                entity.getFileId(),
                entity.getFileName(),
                entity.getFileSize(),
                entity.getMimeType(),
                entity.getUploadedById(),
                entity.getUploadedAt(),
                entity.getApprovedById(),
                entity.getApprovedAt(),
                entity.getSupersededById(),
                entity.getSupersededAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
