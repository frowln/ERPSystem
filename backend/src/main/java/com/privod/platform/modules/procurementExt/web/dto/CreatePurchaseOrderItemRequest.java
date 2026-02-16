package com.privod.platform.modules.procurementExt.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePurchaseOrderItemRequest(
        @NotNull(message = "ID материала обязателен")
        UUID materialId,

        @Size(max = 500, message = "Название материала не должно превышать 500 символов")
        String materialName,

        @Size(max = 20, message = "Единица измерения не должна превышать 20 символов")
        String unit,

        @NotNull(message = "Количество обязательно")
        @DecimalMin(value = "0.0001", message = "Количество должно быть больше нуля")
        BigDecimal quantity,

        @NotNull(message = "Цена за единицу обязательна")
        @DecimalMin(value = "0.01", message = "Цена за единицу должна быть больше нуля")
        BigDecimal unitPrice,

        @DecimalMin(value = "0", message = "Ставка НДС должна быть не меньше 0")
        @DecimalMax(value = "100", message = "Ставка НДС должна быть не больше 100")
        BigDecimal vatRate,

        UUID specificationItemId
) {
}
