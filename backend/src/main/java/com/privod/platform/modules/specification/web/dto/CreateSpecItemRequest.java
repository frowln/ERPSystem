package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.SpecItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateSpecItemRequest(
        @NotNull(message = "Тип позиции обязателен")
        SpecItemType itemType,

        @NotBlank(message = "Наименование обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Size(max = 100, message = "Код продукта не должен превышать 100 символов")
        String productCode,

        @NotNull(message = "Количество обязательно")
        @PositiveOrZero(message = "Количество должно быть >= 0")
        BigDecimal quantity,

        @NotBlank(message = "Единица измерения обязательна")
        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        @PositiveOrZero(message = "Плановая сумма должна быть >= 0")
        BigDecimal plannedAmount,

        String notes,

        Integer sequence,

        Boolean isCustomerProvided
) {
}
