package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.BiOutputFormat;
import com.privod.platform.modules.analytics.domain.BiReportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateAnalyticsReportRequest(
        @NotBlank(message = "Название отчёта обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        BiReportType reportType,

        @Size(max = 100, message = "Категория не должна превышать 100 символов")
        String category,

        String query,

        String parameters,

        BiOutputFormat outputFormat,

        UUID createdById,

        Boolean isPublic,

        String description
) {
}
