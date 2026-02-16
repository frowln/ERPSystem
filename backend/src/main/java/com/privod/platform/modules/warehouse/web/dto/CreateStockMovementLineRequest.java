package com.privod.platform.modules.warehouse.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateStockMovementLineRequest(
        @NotNull(message = "Материал обязателен")
        UUID materialId,

        String materialName,

        Integer sequence,

        @NotNull(message = "Количество обязательно")
        @DecimalMin(value = "0.001", message = "Количество должно быть больше нуля")
        BigDecimal quantity,

        @DecimalMin(value = "0", message = "Цена за единицу не может быть отрицательной")
        BigDecimal unitPrice,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        String notes
) {
}
