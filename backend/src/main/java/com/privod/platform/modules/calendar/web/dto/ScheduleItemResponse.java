package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.ScheduleItem;
import com.privod.platform.modules.calendar.domain.WorkType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ScheduleItemResponse(
        UUID id,
        UUID scheduleId,
        UUID parentItemId,
        String code,
        String name,
        String description,
        WorkType workType,
        String workTypeDisplayName,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        Integer duration,
        Integer progress,
        UUID predecessorItemId,
        Integer lagDays,
        UUID responsibleId,
        String responsibleName,
        boolean isCriticalPath,
        Integer sortOrder,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ScheduleItemResponse fromEntity(ScheduleItem item) {
        return new ScheduleItemResponse(
                item.getId(),
                item.getScheduleId(),
                item.getParentItemId(),
                item.getCode(),
                item.getName(),
                item.getDescription(),
                item.getWorkType(),
                item.getWorkType().getDisplayName(),
                item.getPlannedStartDate(),
                item.getPlannedEndDate(),
                item.getActualStartDate(),
                item.getActualEndDate(),
                item.getDuration(),
                item.getProgress(),
                item.getPredecessorItemId(),
                item.getLagDays(),
                item.getResponsibleId(),
                item.getResponsibleName(),
                item.isCriticalPath(),
                item.getSortOrder(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                item.getCreatedBy()
        );
    }
}
