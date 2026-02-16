package com.privod.platform.modules.mobile.web.dto;

import com.privod.platform.modules.mobile.domain.PhotoCapture;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PhotoCaptureResponse(
        UUID id,
        UUID userId,
        UUID projectId,
        String photoUrl,
        String thumbnailUrl,
        Double latitude,
        Double longitude,
        Instant takenAt,
        String entityType,
        UUID entityId,
        String description,
        List<String> tags,
        Instant createdAt
) {
    public static PhotoCaptureResponse fromEntity(PhotoCapture entity) {
        return new PhotoCaptureResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getProjectId(),
                entity.getPhotoUrl(),
                entity.getThumbnailUrl(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getTakenAt(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getDescription(),
                entity.getTags(),
                entity.getCreatedAt()
        );
    }
}
