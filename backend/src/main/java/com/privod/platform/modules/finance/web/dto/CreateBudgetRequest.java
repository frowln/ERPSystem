package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateBudgetRequest(
        @NotBlank(message = "Наименование бюджета обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        UUID projectId,

        UUID contractId,

        @DecimalMin(value = "0", message = "Плановая выручка не может быть отрицательной")
        BigDecimal plannedRevenue,

        @DecimalMin(value = "0", message = "Плановые затраты не могут быть отрицательными")
        BigDecimal plannedCost,

        BigDecimal plannedMargin,

        String notes
) {
}
