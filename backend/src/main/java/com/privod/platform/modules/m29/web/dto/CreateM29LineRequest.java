package com.privod.platform.modules.m29.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateM29LineRequest(
        UUID specItemId,

        Integer sequence,

        @NotBlank(message = "Наименование материала обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @PositiveOrZero(message = "Плановое количество должно быть неотрицательным")
        BigDecimal plannedQuantity,

        @PositiveOrZero(message = "Фактическое количество должно быть неотрицательным")
        BigDecimal actualQuantity,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        String notes
) {
}
