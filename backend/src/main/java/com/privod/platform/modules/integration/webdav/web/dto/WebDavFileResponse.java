package com.privod.platform.modules.integration.webdav.web.dto;

import com.privod.platform.modules.integration.webdav.domain.WebDavFile;
import com.privod.platform.modules.integration.webdav.domain.WebDavSyncStatus;

import java.time.Instant;
import java.util.UUID;

public record WebDavFileResponse(
        UUID id,
        String remotePath,
        UUID localDocumentId,
        String fileName,
        Long fileSizeBytes,
        String contentType,
        WebDavSyncStatus syncStatus,
        String syncStatusDisplayName,
        Instant lastSyncedAt,
        Instant remoteLastModified,
        String checksum,
        Instant createdAt,
        Instant updatedAt
) {
    public static WebDavFileResponse fromEntity(WebDavFile entity) {
        return new WebDavFileResponse(
                entity.getId(),
                entity.getRemotePath(),
                entity.getLocalDocumentId(),
                entity.getFileName(),
                entity.getFileSizeBytes(),
                entity.getContentType(),
                entity.getSyncStatus(),
                entity.getSyncStatus().getDisplayName(),
                entity.getLastSyncedAt(),
                entity.getRemoteLastModified(),
                entity.getChecksum(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
