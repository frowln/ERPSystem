package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateEstimateItemRequest(
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Positive(message = "Количество должно быть > 0")
        BigDecimal quantity,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        @PositiveOrZero(message = "Цена за единицу должна быть >= 0")
        BigDecimal unitPrice,

        @PositiveOrZero(message = "Цена для заказчика должна быть >= 0")
        BigDecimal unitPriceCustomer,

        @PositiveOrZero(message = "Сумма заказа должна быть >= 0")
        BigDecimal orderedAmount,

        @PositiveOrZero(message = "Сумма счетов должна быть >= 0")
        BigDecimal invoicedAmount,

        @PositiveOrZero(message = "Сумма доставки должна быть >= 0")
        BigDecimal deliveredAmount,

        String notes,

        Integer sequence
) {
}
