package com.privod.platform.modules.changeManagement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateChangeOrderItemRequest(
        @NotNull(message = "Идентификатор ордера на изменение обязателен")
        UUID changeOrderId,

        @NotBlank(message = "Описание позиции обязательно")
        @Size(max = 1000, message = "Описание не должно превышать 1000 символов")
        String description,

        BigDecimal quantity,

        String unit,

        BigDecimal unitPrice,

        UUID costCodeId,

        UUID wbsNodeId,

        Integer sortOrder
) {
}
