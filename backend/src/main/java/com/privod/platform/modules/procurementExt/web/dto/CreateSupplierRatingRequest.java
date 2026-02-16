package com.privod.platform.modules.procurementExt.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateSupplierRatingRequest(
        @NotNull(message = "ID поставщика обязателен")
        UUID supplierId,

        @NotBlank(message = "ID периода обязателен")
        @Size(max = 20, message = "ID периода не должен превышать 20 символов")
        String periodId,

        @NotNull(message = "Оценка качества обязательна")
        @DecimalMin(value = "0.00", message = "Оценка не может быть отрицательной")
        @DecimalMax(value = "10.00", message = "Оценка не может превышать 10")
        BigDecimal qualityScore,

        @NotNull(message = "Оценка доставки обязательна")
        @DecimalMin(value = "0.00", message = "Оценка не может быть отрицательной")
        @DecimalMax(value = "10.00", message = "Оценка не может превышать 10")
        BigDecimal deliveryScore,

        @NotNull(message = "Оценка цены обязательна")
        @DecimalMin(value = "0.00", message = "Оценка не может быть отрицательной")
        @DecimalMax(value = "10.00", message = "Оценка не может превышать 10")
        BigDecimal priceScore,

        UUID evaluatedById,

        @Size(max = 5000, message = "Комментарий не должен превышать 5000 символов")
        String comments
) {
}
