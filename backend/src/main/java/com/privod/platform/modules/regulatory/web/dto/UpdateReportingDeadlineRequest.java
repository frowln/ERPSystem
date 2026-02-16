package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.DeadlineStatus;
import com.privod.platform.modules.regulatory.domain.ReportingFrequency;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateReportingDeadlineRequest(
        String name,
        String reportType,
        ReportingFrequency frequency,
        LocalDate dueDate,
        Integer reminderDaysBefore,
        UUID responsibleId,
        DeadlineStatus status,
        String notes,
        String regulatoryBody,
        BigDecimal penaltyAmount
) {
}
