package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.PhotoAlbum;

import java.time.Instant;
import java.util.UUID;

public record PhotoAlbumResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        UUID coverPhotoId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PhotoAlbumResponse fromEntity(PhotoAlbum entity) {
        return new PhotoAlbumResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getDescription(),
                entity.getCoverPhotoId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
