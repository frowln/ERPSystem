package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RegisterPaymentRequest(
        @NotNull(message = "Сумма оплаты обязательна")
        @DecimalMin(value = "0.01", message = "Сумма оплаты должна быть больше нуля")
        BigDecimal amount
) {
}
