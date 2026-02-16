package com.privod.platform.modules.calendar.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateProgressRequest(
        @NotNull(message = "Прогресс обязателен")
        @Min(value = 0, message = "Прогресс не может быть меньше 0")
        @Max(value = 100, message = "Прогресс не может быть больше 100")
        Integer progress
) {
}
