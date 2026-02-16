package com.privod.platform.modules.selfEmployed.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateSelfEmployedPaymentRequest(
        UUID contractId,

        @DecimalMin(value = "0.01", message = "Сумма выплаты должна быть больше нуля")
        BigDecimal amount,

        @Size(max = 1000, message = "Описание не должно превышать 1000 символов")
        String description,

        LocalDate serviceDate,

        LocalDate paymentDate,

        @Size(max = 100)
        String receiptNumber,

        @Size(max = 1000)
        String receiptUrl,

        @Size(max = 10)
        String taxPeriod
) {
}
