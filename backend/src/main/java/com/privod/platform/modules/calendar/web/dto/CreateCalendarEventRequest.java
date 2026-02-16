package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.EventPriority;
import com.privod.platform.modules.calendar.domain.EventType;
import com.privod.platform.modules.calendar.domain.RecurrenceRule;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateCalendarEventRequest(
        @NotBlank(message = "Название события обязательно")
        @Size(max = 500, message = "Название события не должно превышать 500 символов")
        String title,

        String description,

        @NotNull(message = "Тип события обязателен")
        EventType eventType,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        LocalTime startTime,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate endDate,

        LocalTime endTime,

        boolean isAllDay,

        UUID projectId,
        UUID taskId,

        @NotNull(message = "Идентификатор организатора обязателен")
        UUID organizerId,

        @NotBlank(message = "Имя организатора обязательно")
        String organizerName,

        @Size(max = 500, message = "Местоположение не должно превышать 500 символов")
        String location,

        boolean isOnline,

        @Size(max = 1000, message = "URL встречи не должен превышать 1000 символов")
        String meetingUrl,

        RecurrenceRule recurrenceRule,
        LocalDate recurrenceEndDate,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Цвет должен быть в формате HEX (#RRGGBB)")
        String color,

        EventPriority priority,
        Integer reminderMinutesBefore
) {
}
