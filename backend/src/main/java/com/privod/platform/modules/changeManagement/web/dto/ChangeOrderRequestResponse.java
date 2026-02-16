package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequest;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequestStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ChangeOrderRequestResponse(
        UUID id,
        UUID changeEventId,
        UUID projectId,
        String number,
        String title,
        String description,
        ChangeOrderRequestStatus status,
        String statusDisplayName,
        UUID requestedById,
        LocalDate requestedDate,
        BigDecimal proposedCost,
        Integer proposedScheduleChange,
        String justification,
        String attachmentIds,
        UUID reviewedById,
        LocalDate reviewedDate,
        String reviewComments,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ChangeOrderRequestResponse fromEntity(ChangeOrderRequest entity) {
        return new ChangeOrderRequestResponse(
                entity.getId(),
                entity.getChangeEventId(),
                entity.getProjectId(),
                entity.getNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getRequestedById(),
                entity.getRequestedDate(),
                entity.getProposedCost(),
                entity.getProposedScheduleChange(),
                entity.getJustification(),
                entity.getAttachmentIds(),
                entity.getReviewedById(),
                entity.getReviewedDate(),
                entity.getReviewComments(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
