package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.BudgetCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateBudgetItemRequest(
        Integer sequence,

        @NotNull(message = "Категория обязательна")
        BudgetCategory category,

        @NotBlank(message = "Наименование статьи обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @NotNull(message = "Плановая сумма обязательна")
        @DecimalMin(value = "0", message = "Плановая сумма не может быть отрицательной")
        BigDecimal plannedAmount,

        String notes
) {
}
