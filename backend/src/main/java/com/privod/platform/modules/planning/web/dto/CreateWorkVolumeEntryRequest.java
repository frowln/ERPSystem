package com.privod.platform.modules.planning.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateWorkVolumeEntryRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "ID узла WBS обязателен")
        UUID wbsNodeId,

        @NotNull(message = "Дата записи обязательна")
        LocalDate recordDate,

        @NotNull(message = "Количество обязательно")
        @Positive(message = "Количество должно быть положительным")
        BigDecimal quantity,

        @NotNull(message = "Единица измерения обязательна")
        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        @Size(max = 1000, message = "Описание не должно превышать 1000 символов")
        String description,

        String notes
) {
}
