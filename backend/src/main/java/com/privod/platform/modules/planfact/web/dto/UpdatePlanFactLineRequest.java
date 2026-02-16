package com.privod.platform.modules.planfact.web.dto;

import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record UpdatePlanFactLineRequest(
        @PositiveOrZero(message = "Плановая сумма должна быть неотрицательной")
        BigDecimal planAmount,

        @PositiveOrZero(message = "Фактическая сумма должна быть неотрицательной")
        BigDecimal factAmount,

        String notes
) {
}
