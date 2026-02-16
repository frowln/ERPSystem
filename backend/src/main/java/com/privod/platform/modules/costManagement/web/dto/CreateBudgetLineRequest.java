package com.privod.platform.modules.costManagement.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateBudgetLineRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Код затрат обязателен")
        UUID costCodeId,

        String description,

        @NotNull(message = "Исходный бюджет обязателен")
        @DecimalMin(value = "0", message = "Исходный бюджет не может быть отрицательным")
        BigDecimal originalBudget,

        BigDecimal approvedChanges,

        BigDecimal forecastFinalCost
) {
}
