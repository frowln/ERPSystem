package com.privod.platform.modules.chatter.web.dto;

import com.privod.platform.modules.chatter.domain.Attachment;

import java.time.Instant;
import java.util.UUID;

public record AttachmentResponse(
        UUID id,
        String entityType,
        UUID entityId,
        String fileName,
        String fileUrl,
        long fileSize,
        String mimeType,
        UUID uploadedById,
        Instant uploadedAt,
        Instant createdAt
) {
    public static AttachmentResponse fromEntity(Attachment entity) {
        return new AttachmentResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getFileName(),
                entity.getFileUrl(),
                entity.getFileSize(),
                entity.getMimeType(),
                entity.getUploadedById(),
                entity.getUploadedAt(),
                entity.getCreatedAt()
        );
    }
}
