package com.privod.platform.modules.analytics.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TakeSnapshotRequest(
        @NotNull(message = "Значение KPI обязательно")
        BigDecimal value,

        BigDecimal targetValue,

        UUID projectId,

        LocalDate snapshotDate
) {
}
