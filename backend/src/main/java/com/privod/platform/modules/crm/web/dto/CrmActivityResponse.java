package com.privod.platform.modules.crm.web.dto;

import com.privod.platform.modules.crm.domain.CrmActivity;
import com.privod.platform.modules.crm.domain.CrmActivityType;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record CrmActivityResponse(
        UUID id,
        UUID leadId,
        CrmActivityType activityType,
        String activityTypeDisplayName,
        UUID userId,
        String summary,
        String notes,
        LocalDateTime scheduledAt,
        LocalDateTime completedAt,
        String result,
        boolean completed,
        boolean overdue,
        Instant createdAt
) {
    public static CrmActivityResponse fromEntity(CrmActivity a) {
        return new CrmActivityResponse(
                a.getId(),
                a.getLeadId(),
                a.getActivityType(),
                a.getActivityType().getDisplayName(),
                a.getUserId(),
                a.getSummary(),
                a.getNotes(),
                a.getScheduledAt(),
                a.getCompletedAt(),
                a.getResult(),
                a.isCompleted(),
                a.isOverdue(),
                a.getCreatedAt()
        );
    }
}
