package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.WorkType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateScheduleItemRequest(
        UUID parentItemId,

        @Size(max = 50, message = "Код не должен превышать 50 символов")
        String code,

        @NotBlank(message = "Название позиции обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        String description,

        @NotNull(message = "Тип работ обязателен")
        WorkType workType,

        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        Integer duration,

        @Min(value = 0, message = "Прогресс не может быть меньше 0")
        @Max(value = 100, message = "Прогресс не может быть больше 100")
        Integer progress,

        UUID predecessorItemId,
        Integer lagDays,
        UUID responsibleId,
        String responsibleName,
        boolean isCriticalPath
) {
}
