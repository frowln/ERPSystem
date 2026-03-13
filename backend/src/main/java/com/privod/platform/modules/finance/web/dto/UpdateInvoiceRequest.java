package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateInvoiceRequest(
        LocalDate invoiceDate,

        LocalDate dueDate,

        UUID projectId,

        UUID contractId,

        UUID partnerId,

        @Size(max = 500)
        String partnerName,

        @DecimalMin(value = "0", message = "Сумма без НДС не может быть отрицательной")
        BigDecimal subtotal,

        BigDecimal vatRate,

        @DecimalMin(value = "0.01", message = "Итоговая сумма должна быть больше нуля")
        BigDecimal totalAmount,

        UUID ks2Id,

        UUID ks3Id,

        @Size(max = 50)
        String disciplineMark,

        String notes,

        // P1-CHN-1: опциональная привязка к строке ФМ
        UUID budgetItemId
) {
}
