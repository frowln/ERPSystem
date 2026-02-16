package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.ReportStatus;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateRegulatoryReportRequest(
        UUID projectId,
        String reportType,
        String title,
        String period,
        LocalDate dueDate,
        ReportStatus status,
        String submittedToOrgan,
        String organResponse,
        String fileUrl,
        UUID preparedById,
        UUID submittedById
) {
}
