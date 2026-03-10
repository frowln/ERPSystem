package com.privod.platform.modules.constructability.web.dto;

import com.privod.platform.modules.constructability.domain.ConstructabilityItem;

import java.util.UUID;

public record ConstructabilityItemResponse(
    UUID id,
    UUID reviewId,
    String category,
    String description,
    String severity,
    String status,
    String resolution,
    UUID rfiId,
    String assignedTo,
    String createdAt
) {
    public static ConstructabilityItemResponse fromEntity(ConstructabilityItem e) {
        return new ConstructabilityItemResponse(
            e.getId(),
            e.getReviewId(),
            e.getCategory() != null ? e.getCategory().name() : null,
            e.getDescription(),
            e.getSeverity() != null ? e.getSeverity().name() : "MEDIUM",
            e.getStatus() != null ? e.getStatus().name() : "OPEN",
            e.getResolution(),
            e.getRfiId(),
            e.getAssignedTo(),
            e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
