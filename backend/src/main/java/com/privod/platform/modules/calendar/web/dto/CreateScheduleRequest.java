package com.privod.platform.modules.calendar.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateScheduleRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название календарного плана обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        String description,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate
) {
}
