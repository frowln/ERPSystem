package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.BimClashTest;
import com.privod.platform.modules.bim.domain.ClashTestStatus;

import java.time.Instant;
import java.util.UUID;

public record ClashTestResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        String name,
        String description,
        UUID modelAId,
        UUID modelBId,
        Double toleranceMm,
        ClashTestStatus status,
        String statusDisplayName,
        Instant startedAt,
        Instant completedAt,
        Integer totalClashesFound,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ClashTestResponse fromEntity(BimClashTest entity) {
        return new ClashTestResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getDescription(),
                entity.getModelAId(),
                entity.getModelBId(),
                entity.getToleranceMm(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getTotalClashesFound(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
