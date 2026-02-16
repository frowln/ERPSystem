package com.privod.platform.modules.chatter.web.dto;

import com.privod.platform.modules.chatter.domain.ChatterActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateActivityRequest(
        @NotBlank(message = "Тип сущности обязателен")
        @Size(max = 100, message = "Тип сущности не должен превышать 100 символов")
        String entityType,

        @NotNull(message = "Идентификатор сущности обязателен")
        UUID entityId,

        @NotNull(message = "Тип активности обязателен")
        ChatterActivityType activityType,

        @NotBlank(message = "Краткое описание обязательно")
        @Size(max = 500, message = "Краткое описание не должно превышать 500 символов")
        String summary,

        String description,

        @NotNull(message = "Ответственный обязателен")
        UUID assignedToId,

        @NotNull(message = "Дата выполнения обязательна")
        LocalDate dueDate
) {
}
