package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdatePurchaseRequestItemRequest(
        UUID specItemId,

        Integer sequence,

        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Positive(message = "Количество должно быть положительным")
        BigDecimal quantity,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        @Positive(message = "Цена за единицу должна быть положительной")
        BigDecimal unitPrice,

        String notes
) {
}
