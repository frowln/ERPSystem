package com.privod.platform.modules.calendar.web.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateScheduleRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        String description,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate
) {
}
