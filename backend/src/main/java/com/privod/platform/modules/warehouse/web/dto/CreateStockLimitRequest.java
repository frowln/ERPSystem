package com.privod.platform.modules.warehouse.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateStockLimitRequest(
        @NotNull(message = "Идентификатор материала обязателен")
        UUID materialId,

        @NotNull(message = "Идентификатор склада обязателен")
        UUID warehouseLocationId,

        @PositiveOrZero(message = "Минимальное количество не может быть отрицательным")
        BigDecimal minQuantity,

        @PositiveOrZero(message = "Максимальное количество не может быть отрицательным")
        BigDecimal maxQuantity,

        @PositiveOrZero(message = "Точка перезаказа не может быть отрицательной")
        BigDecimal reorderPoint,

        @PositiveOrZero(message = "Количество перезаказа не может быть отрицательным")
        BigDecimal reorderQuantity,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unit
) {
}
