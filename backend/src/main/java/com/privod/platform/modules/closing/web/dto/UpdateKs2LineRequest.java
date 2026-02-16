package com.privod.platform.modules.closing.web.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateKs2LineRequest(
        UUID specItemId,

        Integer sequence,

        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Positive(message = "Количество должно быть положительным")
        BigDecimal quantity,

        @Positive(message = "Цена за единицу должна быть положительной")
        BigDecimal unitPrice,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        String notes
) {
}
