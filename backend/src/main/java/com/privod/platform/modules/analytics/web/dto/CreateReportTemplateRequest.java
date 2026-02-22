package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.ReportChartType;
import com.privod.platform.modules.analytics.domain.ReportDataSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReportTemplateRequest(
        @NotBlank(message = "Название шаблона обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        @NotNull(message = "Источник данных обязателен")
        ReportDataSource dataSource,

        String columnsJson,

        String filtersJson,

        String groupByJson,

        String sortByJson,

        ReportChartType chartType,

        String chartConfigJson,

        Boolean isPublic,

        Boolean scheduleEnabled,

        @Size(max = 100, message = "Cron-выражение не должно превышать 100 символов")
        String scheduleCron,

        String scheduleRecipients
) {
}
