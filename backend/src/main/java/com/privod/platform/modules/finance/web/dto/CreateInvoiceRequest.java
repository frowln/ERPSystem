package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.InvoiceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateInvoiceRequest(
        @NotNull(message = "Дата счёта обязательна")
        LocalDate invoiceDate,

        LocalDate dueDate,

        UUID projectId,

        UUID contractId,

        UUID partnerId,

        @Size(max = 500)
        String partnerName,

        @NotNull(message = "Тип счёта обязателен")
        InvoiceType invoiceType,

        @DecimalMin(value = "0", message = "Сумма без НДС не может быть отрицательной")
        BigDecimal subtotal,

        BigDecimal vatRate,

        @NotNull(message = "Итоговая сумма обязательна")
        @DecimalMin(value = "0.01", message = "Итоговая сумма должна быть больше нуля")
        BigDecimal totalAmount,

        UUID ks2Id,

        UUID ks3Id,

        @Size(max = 50)
        String disciplineMark,

        String notes
) {
}
