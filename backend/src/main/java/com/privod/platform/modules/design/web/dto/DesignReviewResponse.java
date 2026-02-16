package com.privod.platform.modules.design.web.dto;

import com.privod.platform.modules.design.domain.DesignReview;
import com.privod.platform.modules.design.domain.DesignReviewStatus;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record DesignReviewResponse(
        UUID id,
        UUID designVersionId,
        UUID reviewerId,
        String reviewerName,
        DesignReviewStatus status,
        String statusDisplayName,
        String comments,
        LocalDateTime reviewedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static DesignReviewResponse fromEntity(DesignReview dr) {
        return new DesignReviewResponse(
                dr.getId(),
                dr.getDesignVersionId(),
                dr.getReviewerId(),
                dr.getReviewerName(),
                dr.getStatus(),
                dr.getStatus().getDisplayName(),
                dr.getComments(),
                dr.getReviewedAt(),
                dr.getCreatedAt(),
                dr.getUpdatedAt()
        );
    }
}
