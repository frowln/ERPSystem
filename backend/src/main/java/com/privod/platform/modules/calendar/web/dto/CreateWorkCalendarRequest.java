package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.CalendarType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateWorkCalendarRequest(
        @NotNull(message = "Год обязателен")
        @Min(value = 2000, message = "Год не может быть меньше 2000")
        @Max(value = 2100, message = "Год не может быть больше 2100")
        Integer year,

        CalendarType calendarType,
        UUID projectId,

        @NotBlank(message = "Название календаря обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name
) {
}
