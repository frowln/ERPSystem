package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.EventPriority;
import com.privod.platform.modules.calendar.domain.EventStatus;
import com.privod.platform.modules.calendar.domain.EventType;
import com.privod.platform.modules.calendar.domain.RecurrenceRule;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record UpdateCalendarEventRequest(
        @Size(max = 500, message = "Название события не должно превышать 500 символов")
        String title,

        String description,
        EventType eventType,
        LocalDate startDate,
        LocalTime startTime,
        LocalDate endDate,
        LocalTime endTime,
        Boolean isAllDay,
        UUID projectId,
        UUID taskId,

        @Size(max = 500, message = "Местоположение не должно превышать 500 символов")
        String location,

        Boolean isOnline,

        @Size(max = 1000, message = "URL встречи не должен превышать 1000 символов")
        String meetingUrl,

        RecurrenceRule recurrenceRule,
        LocalDate recurrenceEndDate,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Цвет должен быть в формате HEX (#RRGGBB)")
        String color,

        EventPriority priority,
        Integer reminderMinutesBefore,
        EventStatus status
) {
}
