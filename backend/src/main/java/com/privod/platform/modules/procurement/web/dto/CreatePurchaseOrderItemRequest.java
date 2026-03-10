package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePurchaseOrderItemRequest(
        UUID materialId,

        @NotBlank(message = "Наименование материала обязательно")
        @Size(max = 500, message = "Наименование материала не должно превышать 500 символов")
        String materialName,

        @Size(max = 20, message = "Единица измерения не должна превышать 20 символов")
        String unit,

        @NotNull(message = "Количество обязательно")
        BigDecimal quantity,

        @NotNull(message = "Цена за единицу обязательна")
        BigDecimal unitPrice,

        BigDecimal vatRate,

        UUID specificationItemId
) {
}
