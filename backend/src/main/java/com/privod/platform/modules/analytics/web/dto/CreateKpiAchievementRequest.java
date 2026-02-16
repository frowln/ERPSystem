package com.privod.platform.modules.analytics.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateKpiAchievementRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotNull(message = "ID KPI обязателен")
        UUID kpiId,

        @NotBlank(message = "Период обязателен")
        String period,

        BigDecimal targetValue,
        BigDecimal actualValue,
        BigDecimal achievementPercent,
        BigDecimal score,
        String notes
) {
}
