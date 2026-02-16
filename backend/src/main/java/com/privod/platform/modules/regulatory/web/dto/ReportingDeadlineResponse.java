package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.DeadlineStatus;
import com.privod.platform.modules.regulatory.domain.ReportingDeadline;
import com.privod.platform.modules.regulatory.domain.ReportingFrequency;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ReportingDeadlineResponse(
        UUID id,
        String name,
        String reportType,
        ReportingFrequency frequency,
        String frequencyDisplayName,
        LocalDate dueDate,
        int reminderDaysBefore,
        UUID responsibleId,
        DeadlineStatus status,
        String statusDisplayName,
        Instant submittedAt,
        UUID submittedById,
        String notes,
        String regulatoryBody,
        BigDecimal penaltyAmount,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ReportingDeadlineResponse fromEntity(ReportingDeadline deadline) {
        return new ReportingDeadlineResponse(
                deadline.getId(),
                deadline.getName(),
                deadline.getReportType(),
                deadline.getFrequency(),
                deadline.getFrequency().getDisplayName(),
                deadline.getDueDate(),
                deadline.getReminderDaysBefore(),
                deadline.getResponsibleId(),
                deadline.getStatus(),
                deadline.getStatus().getDisplayName(),
                deadline.getSubmittedAt(),
                deadline.getSubmittedById(),
                deadline.getNotes(),
                deadline.getRegulatoryBody(),
                deadline.getPenaltyAmount(),
                deadline.getCreatedAt(),
                deadline.getUpdatedAt(),
                deadline.getCreatedBy()
        );
    }
}
