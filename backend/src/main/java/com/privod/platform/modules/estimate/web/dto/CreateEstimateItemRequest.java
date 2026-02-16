package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateEstimateItemRequest(
        UUID specItemId,

        @NotBlank(message = "Наименование обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @NotNull(message = "Количество обязательно")
        @Positive(message = "Количество должно быть > 0")
        BigDecimal quantity,

        @NotBlank(message = "Единица измерения обязательна")
        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        @NotNull(message = "Цена за единицу обязательна")
        @PositiveOrZero(message = "Цена за единицу должна быть >= 0")
        BigDecimal unitPrice,

        @PositiveOrZero(message = "Цена для заказчика должна быть >= 0")
        BigDecimal unitPriceCustomer,

        String notes,

        Integer sequence
) {
}
