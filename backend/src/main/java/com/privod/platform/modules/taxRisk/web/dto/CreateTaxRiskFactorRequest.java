package com.privod.platform.modules.taxRisk.web.dto;

import com.privod.platform.modules.taxRisk.domain.FactorCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateTaxRiskFactorRequest(
        @NotBlank(message = "Наименование фактора обязательно")
        @Size(max = 500, message = "Наименование фактора не должно превышать 500 символов")
        String factorName,

        @NotNull(message = "Категория фактора обязательна")
        FactorCategory factorCategory,

        @DecimalMin(value = "0", message = "Вес не может быть отрицательным")
        BigDecimal weight,

        @DecimalMin(value = "0", message = "Оценка не может быть отрицательной")
        @DecimalMax(value = "100", message = "Оценка не может превышать 100")
        BigDecimal score,

        String description,

        String recommendation,

        String evidence
) {
}
