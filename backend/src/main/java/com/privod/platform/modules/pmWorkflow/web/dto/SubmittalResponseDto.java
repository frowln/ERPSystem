package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pto.domain.Submittal;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
import com.privod.platform.modules.pto.domain.SubmittalType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SubmittalResponseDto(
        UUID id,
        UUID projectId,
        String number,
        String title,
        String description,
        SubmittalType submittalType,
        String submittalTypeDisplayName,
        SubmittalStatus status,
        String statusDisplayName,
        String specSection,
        LocalDate dueDate,
        LocalDate submittedDate,
        UUID submittedById,
        UUID ballInCourt,
        Integer leadTime,
        LocalDate requiredDate,
        String linkedDrawingIds,
        String attachmentIds,
        String tags,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SubmittalResponseDto fromEntity(Submittal entity) {
        return new SubmittalResponseDto(
                entity.getId(),
                entity.getProjectId(),
                entity.getCode(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getSubmittalType(),
                entity.getSubmittalType() != null ? entity.getSubmittalType().getDisplayName() : null,
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getSpecSection(),
                entity.getDueDate(),
                entity.getSubmittedDate(),
                entity.getSubmittedById(),
                entity.getBallInCourt(),
                entity.getLeadTime(),
                entity.getRequiredDate(),
                entity.getLinkedDrawingIds(),
                entity.getAttachmentIds(),
                entity.getTags(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
