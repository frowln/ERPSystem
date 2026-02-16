package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.AggregationType;
import com.privod.platform.modules.analytics.domain.KpiCategory;
import com.privod.platform.modules.analytics.domain.KpiDefinition;
import com.privod.platform.modules.analytics.domain.KpiUnit;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record KpiDefinitionResponse(
        UUID id,
        String code,
        String name,
        String description,
        KpiCategory category,
        String categoryDisplayName,
        String dataSource,
        AggregationType aggregationType,
        String aggregationTypeDisplayName,
        String formula,
        KpiUnit unit,
        String unitDisplayName,
        BigDecimal targetValue,
        BigDecimal warningThreshold,
        BigDecimal criticalThreshold,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static KpiDefinitionResponse fromEntity(KpiDefinition kpi) {
        return new KpiDefinitionResponse(
                kpi.getId(),
                kpi.getCode(),
                kpi.getName(),
                kpi.getDescription(),
                kpi.getCategory(),
                kpi.getCategory().getDisplayName(),
                kpi.getDataSource(),
                kpi.getAggregationType(),
                kpi.getAggregationType().getDisplayName(),
                kpi.getFormula(),
                kpi.getUnit(),
                kpi.getUnit().getDisplayName(),
                kpi.getTargetValue(),
                kpi.getWarningThreshold(),
                kpi.getCriticalThreshold(),
                kpi.isActive(),
                kpi.getCreatedAt(),
                kpi.getUpdatedAt(),
                kpi.getCreatedBy()
        );
    }
}
