package com.privod.platform.modules.revenueRecognition.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CalculatePeriodRequest(
        @NotNull(message = "Сумма накопленных затрат обязательна")
        @DecimalMin(value = "0", message = "Сумма накопленных затрат не может быть отрицательной")
        BigDecimal cumulativeCostIncurred,

        UUID calculatedById
) {
}
