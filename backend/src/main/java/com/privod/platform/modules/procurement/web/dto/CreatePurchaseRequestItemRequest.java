package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePurchaseRequestItemRequest(
        UUID specItemId,

        Integer sequence,

        @NotBlank(message = "Наименование позиции обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @NotNull(message = "Количество обязательно")
        @Positive(message = "Количество должно быть положительным")
        BigDecimal quantity,

        @NotBlank(message = "Единица измерения обязательна")
        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        @Positive(message = "Цена за единицу должна быть положительной")
        BigDecimal unitPrice,

        String notes
) {
}
