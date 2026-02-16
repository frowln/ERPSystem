package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.SubmittalReview;
import com.privod.platform.modules.pmWorkflow.domain.SubmittalStatus;

import java.time.Instant;
import java.util.UUID;

public record SubmittalReviewResponseDto(
        UUID id,
        UUID submittalId,
        UUID reviewerId,
        SubmittalStatus status,
        String statusDisplayName,
        String comments,
        Instant reviewedAt,
        String stampType,
        String attachmentIds,
        Instant createdAt,
        String createdBy
) {
    public static SubmittalReviewResponseDto fromEntity(SubmittalReview entity) {
        return new SubmittalReviewResponseDto(
                entity.getId(),
                entity.getSubmittalId(),
                entity.getReviewerId(),
                entity.getStatus(),
                entity.getStatus() != null ? entity.getStatus().getDisplayName() : null,
                entity.getComments(),
                entity.getReviewedAt(),
                entity.getStampType(),
                entity.getAttachmentIds(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
