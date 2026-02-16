package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.CalendarType;
import com.privod.platform.modules.calendar.domain.WorkCalendar;

import java.time.Instant;
import java.util.UUID;

public record WorkCalendarResponse(
        UUID id,
        Integer year,
        CalendarType calendarType,
        String calendarTypeDisplayName,
        UUID projectId,
        String name,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static WorkCalendarResponse fromEntity(WorkCalendar calendar) {
        return new WorkCalendarResponse(
                calendar.getId(),
                calendar.getYear(),
                calendar.getCalendarType(),
                calendar.getCalendarType().getDisplayName(),
                calendar.getProjectId(),
                calendar.getName(),
                calendar.getCreatedAt(),
                calendar.getUpdatedAt(),
                calendar.getCreatedBy()
        );
    }
}
