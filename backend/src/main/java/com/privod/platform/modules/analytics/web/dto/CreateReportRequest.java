package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.OutputFormat;
import com.privod.platform.modules.analytics.domain.ReportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateReportRequest(
        @NotBlank(message = "Название отчёта обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        @NotNull(message = "Тип отчёта обязателен")
        ReportType reportType,

        String queryConfig,

        OutputFormat outputFormat,

        Boolean scheduleEnabled,

        @Size(max = 100, message = "Cron-выражение не должно превышать 100 символов")
        String scheduleCron,

        String scheduleRecipients,

        UUID createdById
) {
}
