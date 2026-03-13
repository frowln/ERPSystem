package com.privod.platform.modules.specification.web.dto;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateCompetitiveListEntryRequest(
        @PositiveOrZero(message = "Цена за единицу должна быть >= 0")
        BigDecimal unitPrice,

        Integer deliveryDays,

        @PositiveOrZero(message = "Процент предоплаты должен быть >= 0")
        BigDecimal prepaymentPercent,

        @PositiveOrZero(message = "Гарантийный срок должен быть >= 0")
        Integer warrantyMonths,

        @Size(max = 500, message = "Условия оплаты не должны превышать 500 символов")
        String paymentTerms,

        Integer paymentDelayDays,

        String notes,

        @Size(max = 500, message = "Название поставщика не должно превышать 500 символов")
        String vendorName
) {
}
