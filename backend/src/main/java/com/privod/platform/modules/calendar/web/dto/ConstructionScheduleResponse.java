package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.ConstructionSchedule;
import com.privod.platform.modules.calendar.domain.ScheduleStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ConstructionScheduleResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        ScheduleStatus status,
        String statusDisplayName,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        Integer docVersion,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ConstructionScheduleResponse fromEntity(ConstructionSchedule schedule) {
        return new ConstructionScheduleResponse(
                schedule.getId(),
                schedule.getProjectId(),
                schedule.getName(),
                schedule.getDescription(),
                schedule.getStatus(),
                schedule.getStatus().getDisplayName(),
                schedule.getPlannedStartDate(),
                schedule.getPlannedEndDate(),
                schedule.getActualStartDate(),
                schedule.getActualEndDate(),
                schedule.getDocVersion(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt(),
                schedule.getCreatedBy()
        );
    }
}
