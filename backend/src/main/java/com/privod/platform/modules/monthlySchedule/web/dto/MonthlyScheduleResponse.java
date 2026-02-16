package com.privod.platform.modules.monthlySchedule.web.dto;

import com.privod.platform.modules.monthlySchedule.domain.MonthlySchedule;
import com.privod.platform.modules.monthlySchedule.domain.MonthlyScheduleStatus;

import java.time.Instant;
import java.util.UUID;

public record MonthlyScheduleResponse(
        UUID id,
        UUID projectId,
        Integer year,
        Integer month,
        MonthlyScheduleStatus status,
        String statusDisplayName,
        UUID approvedById,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MonthlyScheduleResponse fromEntity(MonthlySchedule entity) {
        return new MonthlyScheduleResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getYear(),
                entity.getMonth(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getApprovedById(),
                entity.getApprovedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
