package com.privod.platform.modules.common.web.dto;

import com.privod.platform.modules.common.domain.FileAttachment;

import java.time.Instant;
import java.util.UUID;

public record FileAttachmentResponse(
        UUID id,
        String entityType,
        UUID entityId,
        String fileName,
        Long fileSize,
        String contentType,
        String storagePath,
        String description,
        String uploadedBy,
        Instant createdAt,
        String downloadUrl
) {
    public static FileAttachmentResponse fromEntity(FileAttachment entity) {
        return new FileAttachmentResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getFileName(),
                entity.getFileSize(),
                entity.getContentType(),
                entity.getStoragePath(),
                entity.getDescription(),
                entity.getUploadedBy(),
                entity.getCreatedAt(),
                null
        );
    }
}
