package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.AnalyticsReport;
import com.privod.platform.modules.analytics.domain.BiOutputFormat;
import com.privod.platform.modules.analytics.domain.BiReportType;

import java.time.Instant;
import java.util.UUID;

public record AnalyticsReportResponse(
        UUID id,
        String name,
        BiReportType reportType,
        String reportTypeDisplayName,
        String category,
        String query,
        String parameters,
        BiOutputFormat outputFormat,
        String outputFormatDisplayName,
        Instant lastRunAt,
        int runCount,
        UUID createdById,
        boolean isPublic,
        String description,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static AnalyticsReportResponse fromEntity(AnalyticsReport report) {
        return new AnalyticsReportResponse(
                report.getId(),
                report.getName(),
                report.getReportType(),
                report.getReportType().getDisplayName(),
                report.getCategory(),
                report.getQuery(),
                report.getParameters(),
                report.getOutputFormat(),
                report.getOutputFormat().getDisplayName(),
                report.getLastRunAt(),
                report.getRunCount(),
                report.getCreatedById(),
                report.isPublic(),
                report.getDescription(),
                report.getCreatedAt(),
                report.getUpdatedAt(),
                report.getCreatedBy()
        );
    }
}
