package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.DepreciationMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateFixedAssetRequest(
        @NotBlank(message = "Код ОС обязателен")
        @Size(max = 50)
        String code,

        @NotBlank(message = "Наименование ОС обязательно")
        @Size(max = 500)
        String name,

        @NotBlank(message = "Инвентарный номер обязателен")
        @Size(max = 50)
        String inventoryNumber,

        UUID accountId,

        @NotNull(message = "Дата приобретения обязательна")
        LocalDate purchaseDate,

        @NotNull(message = "Стоимость приобретения обязательна")
        @DecimalMin(value = "0.01", message = "Стоимость должна быть больше 0")
        BigDecimal purchaseAmount,

        @NotNull(message = "Срок полезного использования обязателен")
        @Min(value = 1, message = "СПИ должен быть больше 0")
        Integer usefulLifeMonths,

        DepreciationMethod depreciationMethod
) {
}
