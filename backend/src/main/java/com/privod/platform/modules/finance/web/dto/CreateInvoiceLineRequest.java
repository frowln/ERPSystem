package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateInvoiceLineRequest(
        Integer sequence,

        @NotBlank(message = "Наименование позиции обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @NotNull(message = "Количество обязательно")
        @DecimalMin(value = "0.001", message = "Количество должно быть больше нуля")
        BigDecimal quantity,

        @NotNull(message = "Цена за единицу обязательна")
        @DecimalMin(value = "0", message = "Цена за единицу не может быть отрицательной")
        BigDecimal unitPrice,

        @Size(max = 50)
        String unitOfMeasure
) {
}
