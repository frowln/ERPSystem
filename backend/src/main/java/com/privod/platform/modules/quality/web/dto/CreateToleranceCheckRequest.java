package com.privod.platform.modules.quality.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateToleranceCheckRequest(
        @NotNull(message = "Идентификатор правила допуска обязателен")
        UUID toleranceRuleId,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @Size(max = 500, message = "Место измерения не должно превышать 500 символов")
        String location,

        @NotNull(message = "Измеренное значение обязательно")
        BigDecimal measuredValue,

        UUID checkedById,

        String notes
) {
}
