package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.CorrectiveActionStatus;
import com.privod.platform.modules.safety.domain.CorrectiveActionType;
import com.privod.platform.modules.safety.domain.IncidentCorrectiveAction;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CorrectiveActionResponse(
        UUID id,
        UUID incidentId,
        CorrectiveActionType actionType,
        String actionTypeDisplayName,
        String description,
        UUID responsibleId,
        String responsibleName,
        LocalDate dueDate,
        LocalDate completedDate,
        CorrectiveActionStatus status,
        String statusDisplayName,
        LocalDate verificationDate,
        UUID verifiedById,
        Boolean isEffective,
        String notes,
        boolean overdue,
        Instant createdAt
) {
    public static CorrectiveActionResponse fromEntity(IncidentCorrectiveAction a) {
        return new CorrectiveActionResponse(
                a.getId(),
                a.getIncidentId(),
                a.getActionType(),
                a.getActionType().getDisplayName(),
                a.getDescription(),
                a.getResponsibleId(),
                a.getResponsibleName(),
                a.getDueDate(),
                a.getCompletedDate(),
                a.getStatus(),
                a.getStatus().getDisplayName(),
                a.getVerificationDate(),
                a.getVerifiedById(),
                a.getIsEffective(),
                a.getNotes(),
                a.isOverdue(),
                a.getCreatedAt()
        );
    }
}
