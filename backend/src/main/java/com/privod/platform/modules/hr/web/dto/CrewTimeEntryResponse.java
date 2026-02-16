package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.CrewTimeEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CrewTimeEntryResponse(
        UUID id,
        UUID crewId,
        UUID employeeId,
        UUID projectId,
        LocalDate workDate,
        BigDecimal hoursWorked,
        BigDecimal overtimeHours,
        String activityType,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static CrewTimeEntryResponse fromEntity(CrewTimeEntry e) {
        return new CrewTimeEntryResponse(
                e.getId(),
                e.getCrewId(),
                e.getEmployeeId(),
                e.getProjectId(),
                e.getWorkDate(),
                e.getHoursWorked(),
                e.getOvertimeHours(),
                e.getActivityType(),
                e.getNotes(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
