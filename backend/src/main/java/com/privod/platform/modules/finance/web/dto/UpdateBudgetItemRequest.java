package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.BudgetCategory;
import com.privod.platform.modules.finance.domain.BudgetItemDocStatus;
import com.privod.platform.modules.finance.domain.BudgetItemPriceSource;
import com.privod.platform.modules.finance.domain.BudgetItemType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateBudgetItemRequest(
        Integer sequence,

        UUID parentId,

        BudgetCategory category,

        BudgetItemType itemType,

        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @DecimalMin(value = "0", message = "Количество не может быть отрицательным")
        BigDecimal quantity,

        String unit,

        @DecimalMin(value = "0", message = "Себестоимость не может быть отрицательной")
        BigDecimal costPrice,

        @DecimalMin(value = "0", message = "Сметная цена не может быть отрицательной")
        BigDecimal estimatePrice,

        @DecimalMin(value = "0", message = "Коэффициент не может быть отрицательным")
        BigDecimal coefficient,

        @DecimalMin(value = "0", message = "Ставка НДС не может быть отрицательной")
        BigDecimal vatRate,

        BigDecimal plannedAmount,

        @DecimalMin(value = "0", message = "Цена заказчику не может быть отрицательной")
        BigDecimal customerPrice,

        BudgetItemDocStatus docStatus,

        BudgetItemPriceSource priceSourceType,

        UUID priceSourceId,

        UUID sectionId,

        String notes,

        @Size(max = 10, message = "Шифр дисциплины не должен превышать 10 символов")
        String disciplineMark
) {
}
