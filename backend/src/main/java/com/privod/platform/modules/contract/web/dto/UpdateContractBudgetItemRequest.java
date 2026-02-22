package com.privod.platform.modules.contract.web.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record UpdateContractBudgetItemRequest(
        @DecimalMin(value = "0.0")
        BigDecimal allocatedQuantity,
        @DecimalMin(value = "0.0")
        BigDecimal allocatedAmount,
        String notes
) {
}
