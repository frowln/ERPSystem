package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreatePaymentRequest(
        @NotNull(message = "Дата платежа обязательна")
        LocalDate paymentDate,

        UUID projectId,

        UUID contractId,

        UUID partnerId,

        @Size(max = 500)
        String partnerName,

        @NotNull(message = "Тип платежа обязателен")
        PaymentType paymentType,

        @NotNull(message = "Сумма платежа обязательна")
        @DecimalMin(value = "0.01", message = "Сумма платежа должна быть больше нуля")
        BigDecimal amount,

        @DecimalMin(value = "0", message = "Сумма НДС не может быть отрицательной")
        BigDecimal vatAmount,

        @Size(max = 1000, message = "Назначение платежа не должно превышать 1000 символов")
        String purpose,

        @Size(max = 100)
        String bankAccount,

        UUID invoiceId,

        String notes
) {
}
