package com.privod.platform.modules.closing.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record GenerateKs2FromDailyReportRequest(
        @NotNull(message = "ID дневного отчёта обязателен")
        UUID dailyReportId,

        UUID contractId,

        LocalDate documentDate
) {
}
