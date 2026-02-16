package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record ScheduleActivityRequest(
        @NotBlank(message = "Имя модели обязательно")
        String modelName,

        @NotNull(message = "ID записи обязателен")
        UUID recordId,

        @NotNull(message = "Тип активности обязателен")
        UUID activityTypeId,

        @NotNull(message = "Назначенный пользователь обязателен")
        UUID assignedUserId,

        @Size(max = 500, message = "Краткое описание не должно превышать 500 символов")
        String summary,

        String note,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate dueDate
) {
}
