package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.KpiCategory;
import com.privod.platform.modules.analytics.domain.KpiTrend;
import com.privod.platform.modules.analytics.domain.KpiUnit;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record KpiDashboardItem(
        UUID kpiId,
        String code,
        String name,
        KpiCategory category,
        String categoryDisplayName,
        KpiUnit unit,
        String unitDisplayName,
        BigDecimal currentValue,
        BigDecimal targetValue,
        BigDecimal warningThreshold,
        BigDecimal criticalThreshold,
        KpiTrend trend,
        String trendDisplayName,
        LocalDate lastSnapshotDate,
        String healthStatus
) {
}
