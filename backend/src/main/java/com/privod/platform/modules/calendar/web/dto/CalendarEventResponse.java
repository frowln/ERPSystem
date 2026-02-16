package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.CalendarEvent;
import com.privod.platform.modules.calendar.domain.EventPriority;
import com.privod.platform.modules.calendar.domain.EventStatus;
import com.privod.platform.modules.calendar.domain.EventType;
import com.privod.platform.modules.calendar.domain.RecurrenceRule;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CalendarEventResponse(
        UUID id,
        String title,
        String description,
        EventType eventType,
        String eventTypeDisplayName,
        LocalDate startDate,
        LocalTime startTime,
        LocalDate endDate,
        LocalTime endTime,
        boolean isAllDay,
        UUID projectId,
        UUID taskId,
        UUID organizerId,
        String organizerName,
        String location,
        boolean isOnline,
        String meetingUrl,
        RecurrenceRule recurrenceRule,
        String recurrenceRuleDisplayName,
        LocalDate recurrenceEndDate,
        String color,
        EventPriority priority,
        String priorityDisplayName,
        Integer reminderMinutesBefore,
        EventStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static CalendarEventResponse fromEntity(CalendarEvent event) {
        return new CalendarEventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getEventType(),
                event.getEventType().getDisplayName(),
                event.getStartDate(),
                event.getStartTime(),
                event.getEndDate(),
                event.getEndTime(),
                event.isAllDay(),
                event.getProjectId(),
                event.getTaskId(),
                event.getOrganizerId(),
                event.getOrganizerName(),
                event.getLocation(),
                event.isOnline(),
                event.getMeetingUrl(),
                event.getRecurrenceRule(),
                event.getRecurrenceRule().getDisplayName(),
                event.getRecurrenceEndDate(),
                event.getColor(),
                event.getPriority(),
                event.getPriority().getDisplayName(),
                event.getReminderMinutesBefore(),
                event.getStatus(),
                event.getStatus().getDisplayName(),
                event.getCreatedAt(),
                event.getUpdatedAt(),
                event.getCreatedBy()
        );
    }
}
