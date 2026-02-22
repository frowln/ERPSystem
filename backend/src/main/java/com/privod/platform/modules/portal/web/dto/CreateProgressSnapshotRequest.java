package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateProgressSnapshotRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата снимка обязательна")
        LocalDate snapshotDate,

        @NotNull(message = "Процент выполнения обязателен")
        @DecimalMin(value = "0.00", message = "Процент не может быть отрицательным")
        @DecimalMax(value = "100.00", message = "Процент не может превышать 100")
        BigDecimal overallPercent,

        String description,

        String milestoneSummaryJson,

        String photoReportJson,

        String weatherNotes,

        boolean publish
) {
}
