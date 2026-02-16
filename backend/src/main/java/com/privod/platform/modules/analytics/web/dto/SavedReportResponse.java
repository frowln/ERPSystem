package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.OutputFormat;
import com.privod.platform.modules.analytics.domain.ReportType;
import com.privod.platform.modules.analytics.domain.RunStatus;
import com.privod.platform.modules.analytics.domain.SavedReport;

import java.time.Instant;
import java.util.UUID;

public record SavedReportResponse(
        UUID id,
        String code,
        String name,
        String description,
        ReportType reportType,
        String reportTypeDisplayName,
        String queryConfig,
        OutputFormat outputFormat,
        String outputFormatDisplayName,
        boolean scheduleEnabled,
        String scheduleCron,
        String scheduleRecipients,
        Instant lastRunAt,
        RunStatus lastRunStatus,
        UUID createdById,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SavedReportResponse fromEntity(SavedReport report) {
        return new SavedReportResponse(
                report.getId(),
                report.getCode(),
                report.getName(),
                report.getDescription(),
                report.getReportType(),
                report.getReportType().getDisplayName(),
                report.getQueryConfig(),
                report.getOutputFormat(),
                report.getOutputFormat().getDisplayName(),
                report.isScheduleEnabled(),
                report.getScheduleCron(),
                report.getScheduleRecipients(),
                report.getLastRunAt(),
                report.getLastRunStatus(),
                report.getCreatedById(),
                report.getCreatedAt(),
                report.getUpdatedAt(),
                report.getCreatedBy()
        );
    }
}
