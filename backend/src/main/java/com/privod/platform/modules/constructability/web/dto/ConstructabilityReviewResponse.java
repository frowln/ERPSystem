package com.privod.platform.modules.constructability.web.dto;

import com.privod.platform.modules.constructability.domain.ConstructabilityReview;

import java.time.LocalDate;
import java.util.UUID;

public record ConstructabilityReviewResponse(
    UUID id,
    UUID projectId,
    UUID specificationId,
    String title,
    String status,
    String reviewerName,
    LocalDate reviewDate,
    String overallRating,
    String notes,
    long itemCount,
    String createdAt
) {
    public static ConstructabilityReviewResponse fromEntity(ConstructabilityReview e, long itemCount) {
        return new ConstructabilityReviewResponse(
            e.getId(),
            e.getProjectId(),
            e.getSpecificationId(),
            e.getTitle(),
            e.getStatus() != null ? e.getStatus().name() : "DRAFT",
            e.getReviewerName(),
            e.getReviewDate(),
            e.getOverallRating() != null ? e.getOverallRating().name() : null,
            e.getNotes(),
            itemCount,
            e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
