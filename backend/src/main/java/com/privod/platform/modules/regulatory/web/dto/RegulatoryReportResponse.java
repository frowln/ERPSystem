package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.RegulatoryReport;
import com.privod.platform.modules.regulatory.domain.ReportStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RegulatoryReportResponse(
        UUID id,
        UUID projectId,
        String code,
        String reportType,
        String title,
        String period,
        LocalDate dueDate,
        Instant submittedAt,
        ReportStatus status,
        String statusDisplayName,
        String submittedToOrgan,
        String organResponse,
        String fileUrl,
        UUID preparedById,
        UUID submittedById,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static RegulatoryReportResponse fromEntity(RegulatoryReport report) {
        return new RegulatoryReportResponse(
                report.getId(),
                report.getProjectId(),
                report.getCode(),
                report.getReportType(),
                report.getTitle(),
                report.getPeriod(),
                report.getDueDate(),
                report.getSubmittedAt(),
                report.getStatus(),
                report.getStatus().getDisplayName(),
                report.getSubmittedToOrgan(),
                report.getOrganResponse(),
                report.getFileUrl(),
                report.getPreparedById(),
                report.getSubmittedById(),
                report.getCreatedAt(),
                report.getUpdatedAt(),
                report.getCreatedBy()
        );
    }
}
