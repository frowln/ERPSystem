package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.Submittal;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
import com.privod.platform.modules.pto.domain.SubmittalType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SubmittalResponse(
        UUID id,
        UUID projectId,
        String code,
        String title,
        SubmittalType submittalType,
        String submittalTypeDisplayName,
        String description,
        SubmittalStatus status,
        String statusDisplayName,
        UUID submittedById,
        UUID reviewedById,
        LocalDate dueDate,
        LocalDate responseDate,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SubmittalResponse fromEntity(Submittal entity) {
        return new SubmittalResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getCode(),
                entity.getTitle(),
                entity.getSubmittalType(),
                entity.getSubmittalType().getDisplayName(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getSubmittedById(),
                entity.getReviewedById(),
                entity.getDueDate(),
                entity.getResponseDate(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
