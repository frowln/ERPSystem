package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.KpiSnapshot;
import com.privod.platform.modules.analytics.domain.KpiTrend;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record KpiSnapshotResponse(
        UUID id,
        UUID kpiId,
        UUID projectId,
        LocalDate snapshotDate,
        BigDecimal value,
        BigDecimal targetValue,
        KpiTrend trend,
        String trendDisplayName,
        Instant createdAt
) {
    public static KpiSnapshotResponse fromEntity(KpiSnapshot snapshot) {
        return new KpiSnapshotResponse(
                snapshot.getId(),
                snapshot.getKpiId(),
                snapshot.getProjectId(),
                snapshot.getSnapshotDate(),
                snapshot.getValue(),
                snapshot.getTargetValue(),
                snapshot.getTrend(),
                snapshot.getTrend().getDisplayName(),
                snapshot.getCreatedAt()
        );
    }
}
