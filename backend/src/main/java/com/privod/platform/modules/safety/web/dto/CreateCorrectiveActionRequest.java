package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.CorrectiveActionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateCorrectiveActionRequest(
        @NotNull(message = "Тип действия обязателен")
        CorrectiveActionType actionType,

        @NotBlank(message = "Описание действия обязательно")
        String description,

        UUID responsibleId,
        String responsibleName,

        @NotNull(message = "Срок выполнения обязателен")
        LocalDate dueDate,

        String notes
) {
}
