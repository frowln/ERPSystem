package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record DeliveryItemRequest(
        @NotNull(message = "ID позиции обязателен")
        UUID itemId,

        @NotNull(message = "Количество доставки обязательно")
        BigDecimal deliveredQuantity
) {
}
