package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.MaterialCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateMaterialRequest(
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Size(max = 100, message = "Код не должен превышать 100 символов")
        String code,

        MaterialCategory category,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        String description,

        @DecimalMin(value = "0", message = "Минимальный остаток не может быть отрицательным")
        BigDecimal minStockLevel,

        @DecimalMin(value = "0", message = "Цена не может быть отрицательной")
        BigDecimal currentPrice,

        Boolean active
) {
}
