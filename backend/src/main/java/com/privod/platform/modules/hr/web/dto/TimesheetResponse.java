package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.Timesheet;
import com.privod.platform.modules.hr.domain.TimesheetStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TimesheetResponse(
        UUID id,
        UUID employeeId,
        UUID projectId,
        LocalDate workDate,
        BigDecimal hoursWorked,
        BigDecimal overtimeHours,
        TimesheetStatus status,
        String statusDisplayName,
        UUID approvedById,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static TimesheetResponse fromEntity(Timesheet ts) {
        return new TimesheetResponse(
                ts.getId(),
                ts.getEmployeeId(),
                ts.getProjectId(),
                ts.getWorkDate(),
                ts.getHoursWorked(),
                ts.getOvertimeHours(),
                ts.getStatus(),
                ts.getStatus().getDisplayName(),
                ts.getApprovedById(),
                ts.getNotes(),
                ts.getCreatedAt(),
                ts.getUpdatedAt()
        );
    }
}
