package com.privod.platform.modules.planning.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEvmSnapshotRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата снимка обязательна")
        LocalDate snapshotDate,

        LocalDate dataDate,
        BigDecimal budgetAtCompletion,
        BigDecimal plannedValue,
        BigDecimal earnedValue,
        BigDecimal actualCost,
        BigDecimal percentComplete,
        Integer criticalPathLength,
        String notes
) {
}
