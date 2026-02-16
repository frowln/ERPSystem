package com.privod.platform.modules.priceCoefficient.web.dto;

import com.privod.platform.modules.priceCoefficient.domain.CoefficientType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PriceCoefficientRequest(
        @NotBlank(message = "Наименование коэффициента обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Size(max = 50, message = "Код не должен превышать 50 символов")
        String code,

        @NotNull(message = "Значение коэффициента обязательно")
        @DecimalMin(value = "0.000001", message = "Значение коэффициента должно быть больше нуля")
        BigDecimal value,

        @NotNull(message = "Дата начала действия обязательна")
        LocalDate effectiveFrom,

        LocalDate effectiveTo,

        UUID contractId,

        UUID projectId,

        @NotNull(message = "Тип коэффициента обязателен")
        CoefficientType type,

        String description,

        Boolean appliedToEstimateItems
) {
}
