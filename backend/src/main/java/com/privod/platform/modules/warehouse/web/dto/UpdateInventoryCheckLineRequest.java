package com.privod.platform.modules.warehouse.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateInventoryCheckLineRequest(
        @NotNull(message = "Идентификатор строки обязателен")
        UUID lineId,

        @NotNull(message = "Фактическое количество обязательно")
        @DecimalMin(value = "0", message = "Фактическое количество не может быть отрицательным")
        BigDecimal actualQuantity,

        String notes
) {
}
