package com.privod.platform.modules.changeManagement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateChangeOrderRequestRequest(
        @NotNull(message = "Идентификатор события изменения обязателен")
        UUID changeEventId,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название запроса на изменение обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        String description,

        UUID requestedById,

        LocalDate requestedDate,

        BigDecimal proposedCost,

        Integer proposedScheduleChange,

        String justification,

        String attachmentIds
) {
}
