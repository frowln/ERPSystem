package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.SpecItemType;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateSpecItemRequest(
        SpecItemType itemType,

        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Size(max = 255)
        String brand,

        @Size(max = 100, message = "Код продукта не должен превышать 100 символов")
        String productCode,

        @Size(max = 255)
        String manufacturer,

        @PositiveOrZero(message = "Количество должно быть >= 0")
        BigDecimal quantity,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unitOfMeasure,

        @PositiveOrZero(message = "Плановая сумма должна быть >= 0")
        BigDecimal plannedAmount,

        @PositiveOrZero
        BigDecimal weight,

        String notes,

        Integer sequence,

        String procurementStatus,

        String estimateStatus,

        Boolean isCustomerProvided,

        /** Back-link to the ФМ budget item created from this spec position */
        UUID budgetItemId,

        @Size(max = 20)
        String position,

        @Size(max = 500)
        String sectionName
) {
}
