package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.ForecastMethod;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCostForecastRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата прогноза обязательна")
        LocalDate forecastDate,

        ForecastMethod forecastMethod,

        BigDecimal budgetAtCompletion,

        BigDecimal earnedValue,

        BigDecimal plannedValue,

        BigDecimal actualCost,

        BigDecimal percentComplete,

        String notes,

        UUID createdById
) {
}
