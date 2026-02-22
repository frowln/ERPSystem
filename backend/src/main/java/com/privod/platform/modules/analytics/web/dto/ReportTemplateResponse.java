package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.ReportChartType;
import com.privod.platform.modules.analytics.domain.ReportDataSource;
import com.privod.platform.modules.analytics.domain.ReportTemplate;

import java.time.Instant;
import java.util.UUID;

public record ReportTemplateResponse(
        UUID id,
        UUID organizationId,
        String name,
        String description,
        ReportDataSource dataSource,
        String dataSourceDisplayName,
        String columnsJson,
        String filtersJson,
        String groupByJson,
        String sortByJson,
        ReportChartType chartType,
        String chartTypeDisplayName,
        String chartConfigJson,
        boolean isPublic,
        boolean scheduleEnabled,
        String scheduleCron,
        String scheduleRecipients,
        Instant lastRunAt,
        UUID createdById,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ReportTemplateResponse fromEntity(ReportTemplate template) {
        return new ReportTemplateResponse(
                template.getId(),
                template.getOrganizationId(),
                template.getName(),
                template.getDescription(),
                template.getDataSource(),
                template.getDataSource().getDisplayName(),
                template.getColumnsJson(),
                template.getFiltersJson(),
                template.getGroupByJson(),
                template.getSortByJson(),
                template.getChartType(),
                template.getChartType() != null ? template.getChartType().getDisplayName() : null,
                template.getChartConfigJson(),
                template.isPublic(),
                template.isScheduleEnabled(),
                template.getScheduleCron(),
                template.getScheduleRecipients(),
                template.getLastRunAt(),
                template.getCreatedById(),
                template.getCreatedAt(),
                template.getUpdatedAt(),
                template.getCreatedBy()
        );
    }
}
