package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ToleranceCategory;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateToleranceRuleRequest(
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        ToleranceCategory category,

        @Size(max = 500, message = "Наименование параметра не должно превышать 500 символов")
        String parameterName,

        BigDecimal nominalValue,
        BigDecimal minValue,
        BigDecimal maxValue,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unit,

        @Size(max = 255, message = "Ссылка на стандарт не должна превышать 255 символов")
        String standardReference,

        Boolean isActive
) {
}
