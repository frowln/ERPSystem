package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.AggregationType;
import com.privod.platform.modules.analytics.domain.KpiCategory;
import com.privod.platform.modules.analytics.domain.KpiUnit;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateKpiDefinitionRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        KpiCategory category,

        @Size(max = 255, message = "Источник данных не должен превышать 255 символов")
        String dataSource,

        AggregationType aggregationType,

        String formula,

        KpiUnit unit,

        BigDecimal targetValue,

        BigDecimal warningThreshold,

        BigDecimal criticalThreshold,

        Boolean isActive
) {
}
