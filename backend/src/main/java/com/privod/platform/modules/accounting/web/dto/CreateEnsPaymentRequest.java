package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.EnsTaxType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEnsPaymentRequest(
        @NotNull(message = "ID счёта ЕНС обязателен")
        UUID ensAccountId,

        @NotNull(message = "Сумма обязательна")
        @DecimalMin(value = "0.01", message = "Сумма должна быть больше 0")
        BigDecimal amount,

        @NotNull(message = "Дата платежа обязательна")
        LocalDate paymentDate,

        @NotNull(message = "Вид налога обязателен")
        EnsTaxType taxType,

        String receiptUrl
) {
}
