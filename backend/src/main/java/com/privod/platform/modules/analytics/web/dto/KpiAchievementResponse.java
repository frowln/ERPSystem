package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.KpiAchievement;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record KpiAchievementResponse(
        UUID id,
        UUID employeeId,
        UUID kpiId,
        String period,
        BigDecimal targetValue,
        BigDecimal actualValue,
        BigDecimal achievementPercent,
        BigDecimal score,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static KpiAchievementResponse fromEntity(KpiAchievement ka) {
        return new KpiAchievementResponse(
                ka.getId(),
                ka.getEmployeeId(),
                ka.getKpiId(),
                ka.getPeriod(),
                ka.getTargetValue(),
                ka.getActualValue(),
                ka.getAchievementPercent(),
                ka.getScore(),
                ka.getNotes(),
                ka.getCreatedAt(),
                ka.getUpdatedAt()
        );
    }
}
