package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.PhotoComparison;

import java.time.Instant;
import java.util.UUID;

public record PhotoComparisonResponse(
        UUID id,
        UUID beforePhotoId,
        UUID afterPhotoId,
        UUID projectId,
        String title,
        String description,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PhotoComparisonResponse fromEntity(PhotoComparison entity) {
        return new PhotoComparisonResponse(
                entity.getId(),
                entity.getBeforePhotoId(),
                entity.getAfterPhotoId(),
                entity.getProjectId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
