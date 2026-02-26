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

        @Size(max = 255, message = "Тип/марка не должны превышать 255 символов")
        String brand,

        @Size(max = 100, message = "Код продукта не должен превышать 100 символов")
        String productCode,

        @Size(max = 255, message = "Завод-изготовитель не должен превышать 255 символов")
        String manufacturer,

        @NotNull(message = "Количество обязательно")
        @PositiveOrZero(message = "Количество должно быть >= 0")
        BigDecimal quantity,

        @NotBlank(message = "Единица измерения обязательна")
        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        @PositiveOrZero(message = "Плановая сумма должна быть >= 0")
        BigDecimal plannedAmount,

        @PositiveOrZero(message = "Вес должен быть >= 0")
        java.math.BigDecimal weight,

        String notes,

        Integer sequence,

        Boolean isCustomerProvided,

        /** Position number from the PDF (e.g. "1", "1.1", "А1") */
        @Size(max = 20)
        String position,

        /** Section grouping label (e.g. "СИСТЕМА ОТОПЛЕНИЯ (ОВ)") */
        @Size(max = 500)
        String sectionName
) {
}
