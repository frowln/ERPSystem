package com.privod.platform.modules.contract.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record LinkBudgetItemsRequest(
        @NotEmpty List<@Valid BudgetItemLink> items
) {
    public record BudgetItemLink(
            @NotNull UUID budgetItemId,
            @DecimalMin(value = "0.0")
            BigDecimal allocatedQuantity,
            @DecimalMin(value = "0.0")
            BigDecimal allocatedAmount,
            String notes
    ) {}
}
