package com.privod.platform.modules.ops.web.dto;

import com.privod.platform.modules.ops.domain.WeatherImpact;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateDailyReportRequest(
        @NotNull(message = "ID наряд-задания обязателен")
        UUID workOrderId,

        @NotNull(message = "Дата отчёта обязательна")
        LocalDate reportDate,

        String workDone,
        String issues,
        String materialsUsed,
        BigDecimal laborHours,
        BigDecimal equipmentHours,
        WeatherImpact weatherImpact,
        UUID submittedById
) {
}
