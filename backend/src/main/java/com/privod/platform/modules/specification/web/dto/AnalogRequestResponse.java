package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.AnalogRequest;
import com.privod.platform.modules.specification.domain.AnalogRequestStatus;

import java.time.Instant;
import java.util.UUID;

public record AnalogRequestResponse(
        UUID id,
        UUID projectId,
        UUID originalMaterialId,
        UUID requestedById,
        String reason,
        AnalogRequestStatus status,
        String statusDisplayName,
        UUID approvedAnalogId,
        UUID approvedById,
        String reviewComment,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static AnalogRequestResponse fromEntity(AnalogRequest entity) {
        return new AnalogRequestResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getOriginalMaterialId(),
                entity.getRequestedById(),
                entity.getReason(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getApprovedAnalogId(),
                entity.getApprovedById(),
                entity.getReviewComment(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
