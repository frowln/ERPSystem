package com.privod.platform.modules.monthlySchedule.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateMonthlyScheduleRequest(
        UUID projectId,

        @NotNull(message = "Год обязателен")
        @Min(value = 2000, message = "Год не может быть раньше 2000")
        Integer year,

        @NotNull(message = "Месяц обязателен")
        @Min(value = 1, message = "Месяц должен быть от 1 до 12")
        @Max(value = 12, message = "Месяц должен быть от 1 до 12")
        Integer month
) {
}
