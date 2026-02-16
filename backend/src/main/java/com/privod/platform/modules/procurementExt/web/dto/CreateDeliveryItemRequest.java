package com.privod.platform.modules.procurementExt.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateDeliveryItemRequest(
        @NotNull(message = "ID материала обязателен")
        UUID materialId,

        @NotNull(message = "Количество обязательно")
        BigDecimal quantity,

        String unit,
        BigDecimal weight
) {
}
