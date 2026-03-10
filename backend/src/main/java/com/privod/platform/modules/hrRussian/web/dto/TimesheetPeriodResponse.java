package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.TimesheetPeriod;
import com.privod.platform.modules.hrRussian.domain.TimesheetPeriodStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TimesheetPeriodResponse(
        UUID id,
        UUID employeeId,
        int month,
        int year,
        TimesheetPeriodStatus status,
        BigDecimal totalHours,
        UUID approvedById,
        Instant createdAt,
        Instant updatedAt
) {
    public static TimesheetPeriodResponse fromEntity(TimesheetPeriod tp) {
        return new TimesheetPeriodResponse(
                tp.getId(),
                tp.getEmployeeId(),
                tp.getMonth(),
                tp.getYear(),
                tp.getStatus(),
                tp.getTotalHours(),
                tp.getApprovedById(),
                tp.getCreatedAt(),
                tp.getUpdatedAt()
        );
    }
}
