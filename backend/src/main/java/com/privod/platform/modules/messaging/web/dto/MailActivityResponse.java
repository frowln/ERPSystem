package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MailActivity;
import com.privod.platform.modules.messaging.domain.MailActivityStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MailActivityResponse(
        UUID id,
        String modelName,
        UUID recordId,
        UUID activityTypeId,
        UUID userId,
        UUID assignedUserId,
        String summary,
        String note,
        LocalDate dueDate,
        MailActivityStatus status,
        String statusDisplayName,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static MailActivityResponse fromEntity(MailActivity activity) {
        return new MailActivityResponse(
                activity.getId(),
                activity.getModelName(),
                activity.getRecordId(),
                activity.getActivityTypeId(),
                activity.getUserId(),
                activity.getAssignedUserId(),
                activity.getSummary(),
                activity.getNote(),
                activity.getDueDate(),
                activity.getStatus(),
                activity.getStatus().getDisplayName(),
                activity.getCompletedAt(),
                activity.getCreatedAt(),
                activity.getUpdatedAt()
        );
    }
}
