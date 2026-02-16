package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.ScheduleItem;
import com.privod.platform.modules.calendar.domain.WorkType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GanttItemResponse(
        UUID id,
        UUID parentItemId,
        String code,
        String name,
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
        String responsibleName,
        boolean isCriticalPath,
        Integer sortOrder,
        List<GanttItemResponse> children
) {
    public static GanttItemResponse fromEntity(ScheduleItem item, List<GanttItemResponse> children) {
        return new GanttItemResponse(
                item.getId(),
                item.getParentItemId(),
                item.getCode(),
                item.getName(),
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
                item.getResponsibleName(),
                item.isCriticalPath(),
                item.getSortOrder(),
                children
        );
    }
}
